import { auth } from "@/lib/auth"
import { accountService } from "@/lib/grpc/client"
import logger from "@/lib/logger"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const apiKey = process.env.GRPC_API_KEY
  if (!apiKey) return Response.json({ error: "Server misconfigured" }, { status: 503 })
  const abort = new AbortController()
  const source = accountService.exportData({ userId: session.user.id }, apiKey, AbortSignal.any([request.signal, abort.signal]))
  let first: Awaited<ReturnType<typeof source.next>>
  try {
    first = await source.next()
  } catch (error) {
    logger.error({ error }, "Account export failed")
    return Response.json({ error: "Unable to export account" }, { status: 502 })
  }
  async function* chunks() {
    yield `{"exportDate":${JSON.stringify(new Date().toISOString())},"items":[`
    if (!first.done) {
      yield JSON.stringify(first.value)
      for await (const item of source) yield `,${JSON.stringify(item)}`
    }
    yield "]}"
  }
  const iterator = chunks()
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next()
        if (next.done) controller.close()
        else controller.enqueue(encoder.encode(next.value))
      } catch (error) {
        logger.error({ error }, "Account export interrupted")
        controller.error(error)
      }
    },
    async cancel() {
      abort.abort()
      await source.return(undefined)
      await iterator.return(undefined)
    },
  })
  return new Response(body, { headers: {
    "Content-Type": "application/json",
    "Content-Disposition": `attachment; filename="etu-account-${new Date().toISOString().slice(0, 10)}.json"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } })
}
