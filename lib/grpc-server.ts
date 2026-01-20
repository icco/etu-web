/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import { join } from "path"
import { db } from "@/lib/db"
import { verifyApiKey } from "@/lib/actions/api-keys"
import type { Prisma } from "@prisma/client"

// Load protobuf definitions
const PROTO_PATH = join(process.cwd(), "proto", "etu.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const etuProto = protoDescriptor.etu

// Helper to get user ID from metadata
async function getUserIdFromMetadata(call: any): Promise<string | null> {
  const metadata = call.metadata
  const authHeader = metadata.get("authorization")[0]
  
  if (!authHeader || !authHeader.toString().startsWith("etu_")) {
    return null
  }

  return await verifyApiKey(authHeader.toString())
}

// Helper to convert Date to Timestamp
function dateToTimestamp(date: Date) {
  const seconds = Math.floor(date.getTime() / 1000)
  const nanos = (date.getTime() % 1000) * 1000000
  return { seconds, nanos }
}

// NotesService implementation
const notesService = {
  async listNotes(call: any, callback: any) {
    try {
      const userId = await getUserIdFromMetadata(call)
      
      if (!userId) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Unauthorized. Please provide a valid API key in metadata.",
        })
      }

      const request = call.request
      const where: Prisma.NoteWhereInput = { userId }

      // Search filter
      if (request.search) {
        where.content = { contains: request.search, mode: "insensitive" }
      }

      // Date range filter
      if (request.start_date || request.end_date) {
        where.createdAt = {}
        if (request.start_date) where.createdAt.gte = new Date(request.start_date)
        if (request.end_date) where.createdAt.lte = new Date(request.end_date)
      }

      // Tag filter
      if (request.tags?.length) {
        where.tags = {
          some: {
            tag: {
              name: { in: request.tags },
            },
          },
        }
      }

      const limit = Math.min(request.limit || 50, 100)
      const offset = request.offset || 0

      const [notes, total] = await Promise.all([
        db.note.findMany({
          where,
          include: {
            tags: {
              include: { tag: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        db.note.count({ where }),
      ])

      callback(null, {
        notes: notes.map((note: any) => ({
          id: note.id,
          content: note.content,
          tags: note.tags.map((t: any) => t.tag.name),
          created_at: dateToTimestamp(note.createdAt),
          updated_at: dateToTimestamp(note.updatedAt),
        })),
        total,
        limit,
        offset,
      })
    } catch (error) {
      console.error("listNotes error:", error)
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      })
    }
  },

  async createNote(call: any, callback: any) {
    try {
      const userId = await getUserIdFromMetadata(call)
      
      if (!userId) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Unauthorized. Please provide a valid API key in metadata.",
        })
      }

      const request = call.request
      
      if (!request.content) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Content is required",
        })
      }

      const note = await db.$transaction(async (tx: Prisma.TransactionClient) => {
        const note = await tx.note.create({
          data: {
            content: request.content,
            userId,
          },
        })

        for (const tagName of request.tags || []) {
          const tag = await tx.tag.upsert({
            where: { userId_name: { userId, name: tagName } },
            update: {},
            create: { name: tagName, userId },
          })

          await tx.noteTag.create({
            data: { noteId: note.id, tagId: tag.id },
          })
        }

        return await tx.note.findUnique({
          where: { id: note.id },
          include: {
            tags: {
              include: { tag: true },
            },
          },
        })
      })

      callback(null, {
        note: {
          id: note!.id,
          content: note!.content,
          tags: note!.tags.map((t: any) => t.tag.name),
          created_at: dateToTimestamp(note!.createdAt),
          updated_at: dateToTimestamp(note!.updatedAt),
        },
      })
    } catch (error) {
      console.error("createNote error:", error)
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      })
    }
  },

  async getNote(call: any, callback: any) {
    try {
      const userId = await getUserIdFromMetadata(call)
      
      if (!userId) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Unauthorized. Please provide a valid API key in metadata.",
        })
      }

      const request = call.request
      
      const note = await db.note.findFirst({
        where: { id: request.id, userId },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      })

      if (!note) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Note not found",
        })
      }

      callback(null, {
        note: {
          id: note.id,
          content: note.content,
          tags: note.tags.map((t: any) => t.tag.name),
          created_at: dateToTimestamp(note.createdAt),
          updated_at: dateToTimestamp(note.updatedAt),
        },
      })
    } catch (error) {
      console.error("getNote error:", error)
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      })
    }
  },

  async updateNote(call: any, callback: any) {
    try {
      const userId = await getUserIdFromMetadata(call)
      
      if (!userId) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Unauthorized. Please provide a valid API key in metadata.",
        })
      }

      const request = call.request
      
      const existing = await db.note.findFirst({
        where: { id: request.id, userId },
      })

      if (!existing) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Note not found",
        })
      }

      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        if (request.content !== undefined) {
          await tx.note.update({
            where: { id: request.id },
            data: { content: request.content },
          })
        }

        if (request.tags !== undefined) {
          await tx.noteTag.deleteMany({ where: { noteId: request.id } })

          for (const tagName of request.tags) {
            const tag = await tx.tag.upsert({
              where: { userId_name: { userId, name: tagName } },
              update: {},
              create: { name: tagName, userId },
            })

            await tx.noteTag.create({
              data: { noteId: request.id, tagId: tag.id },
            })
          }
        }
      })

      const note = await db.note.findUnique({
        where: { id: request.id },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      })

      callback(null, {
        note: {
          id: note!.id,
          content: note!.content,
          tags: note!.tags.map((t: any) => t.tag.name),
          created_at: dateToTimestamp(note!.createdAt),
          updated_at: dateToTimestamp(note!.updatedAt),
        },
      })
    } catch (error) {
      console.error("updateNote error:", error)
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      })
    }
  },

  async deleteNote(call: any, callback: any) {
    try {
      const userId = await getUserIdFromMetadata(call)
      
      if (!userId) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Unauthorized. Please provide a valid API key in metadata.",
        })
      }

      const request = call.request
      
      const note = await db.note.findFirst({
        where: { id: request.id, userId },
      })

      if (!note) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Note not found",
        })
      }

      await db.note.delete({ where: { id: request.id } })

      callback(null, { success: true })
    } catch (error) {
      console.error("deleteNote error:", error)
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      })
    }
  },
}

// TagsService implementation
const tagsService = {
  async listTags(call: any, callback: any) {
    try {
      const userId = await getUserIdFromMetadata(call)
      
      if (!userId) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Unauthorized. Please provide a valid API key in metadata.",
        })
      }

      const tags = await db.tag.findMany({
        where: { userId },
        include: {
          _count: { select: { notes: true } },
        },
        orderBy: { name: "asc" },
      })

      callback(null, {
        tags: tags.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          count: tag._count.notes,
          created_at: dateToTimestamp(tag.createdAt),
        })),
      })
    } catch (error) {
      console.error("listTags error:", error)
      callback({
        code: grpc.status.INTERNAL,
        message: "Internal server error",
      })
    }
  },
}

// Start gRPC server
export function startGrpcServer(port = 50051) {
  const server = new grpc.Server()
  
  server.addService(etuProto.NotesService.service, notesService)
  server.addService(etuProto.TagsService.service, tagsService)
  
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("Failed to start gRPC server:", err)
        return
      }
      console.log(`gRPC server running on port ${port}`)
    }
  )
  
  return server
}
