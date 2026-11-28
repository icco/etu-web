import { test, expect } from "@playwright/test"
import { groupNotesByDate } from "../lib/utils/group-notes"
import type { Note } from "../lib/types"

const note = (id: string, iso: string) => ({ id, content: "", tags: [], images: [], audios: [], createdAt: new Date(iso), updatedAt: new Date(iso) }) as Note

test("groups notes by the viewer's local day", () => {
  const previous = process.env.TZ
  process.env.TZ = "America/Los_Angeles"
  try {
    const grouped = groupNotesByDate([note("morning", "2026-03-03T18:00:00Z"), note("evening", "2026-03-04T04:00:00Z")])
    expect([...grouped.keys()]).toEqual(["2026-03-03"])
    expect(grouped.get("2026-03-03")?.map((n) => n.id)).toEqual(["morning", "evening"])
  } finally {
    process.env.TZ = previous
  }
})
