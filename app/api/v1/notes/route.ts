import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authenticateRequest, API_CONSTANTS } from "@/lib/api/auth"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const userId = await authenticateRequest(req)
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please provide a valid API key in the Authorization header." },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || undefined
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || undefined
    let limit = parseInt(searchParams.get("limit") || String(API_CONSTANTS.DEFAULT_NOTES_LIMIT), 10)
    let offset = parseInt(searchParams.get("offset") || "0", 10)

    // Validate limit and offset
    if (Number.isNaN(limit) || limit < 0) {
      limit = API_CONSTANTS.DEFAULT_NOTES_LIMIT
    }
    if (Number.isNaN(offset) || offset < 0) {
      offset = 0
    }

    // Parse and validate date parameters
    let startDate: Date | undefined
    let endDate: Date | undefined
    
    const startDateParam = searchParams.get("start_date")
    if (startDateParam) {
      const parsedStartDate = new Date(startDateParam)
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start_date parameter. Expected an ISO 8601 date string." },
          { status: 400 }
        )
      }
      startDate = parsedStartDate
    }

    const endDateParam = searchParams.get("end_date")
    if (endDateParam) {
      const parsedEndDate = new Date(endDateParam)
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end_date parameter. Expected an ISO 8601 date string." },
          { status: 400 }
        )
      }
      endDate = parsedEndDate
    }

    const where: Prisma.NoteWhereInput = { userId }

    // Search filter
    if (search) {
      where.content = { contains: search, mode: "insensitive" }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    // Tag filter
    if (tags?.length) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      }
    }

    const [notes, total] = await Promise.all([
      db.note.findMany({
        where,
        include: {
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, API_CONSTANTS.MAX_NOTES_LIMIT),
        skip: offset,
      }),
      db.note.count({ where }),
    ])

    return NextResponse.json({
      notes: notes.map((note) => ({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        tags: note.tags.map((t: { tag: { name: string } }) => t.tag.name),
      })),
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("GET /api/v1/notes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticateRequest(req)
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please provide a valid API key in the Authorization header." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { content, tags = [] } = body

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required and must be a string" },
        { status: 400 }
      )
    }

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: "Tags must be an array of strings" },
        { status: 400 }
      )
    }

    const note = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create note
      const note = await tx.note.create({
        data: {
          content,
          userId,
        },
      })

      // Handle tags
      for (const tagName of tags) {
        if (typeof tagName !== "string") continue

        // Get or create tag
        const tag = await tx.tag.upsert({
          where: { userId_name: { userId, name: tagName } },
          update: {},
          create: { name: tagName, userId },
        })

        // Link to note
        await tx.noteTag.create({
          data: { noteId: note.id, tagId: tag.id },
        })
      }

      // Fetch the complete note with tags
      return await tx.note.findUnique({
        where: { id: note.id },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      })
    })

    if (!note) {
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        tags: note.tags.map((t: { tag: { name: string } }) => t.tag.name),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/v1/notes error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
