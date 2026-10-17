import type { Instrumentation } from "next"
import { sanitizeRoute } from "@/lib/telemetry"

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const names = ["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError", "URIError", "AggregateError"]
  const name = error instanceof Error && names.includes(error.name) ? error.name : "Error"
  const fields = {
    telemetry: "server_error",
    kind: name,
    route: sanitizeRoute(request.path),
    operation: context.routeType,
  }
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logServerError } = await import("@/lib/error-reporting")
    logServerError(fields)
  } else {
    console.error(JSON.stringify({ ...fields, message: "Server request error" }))
  }
}
