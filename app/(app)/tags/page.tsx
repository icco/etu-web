import { getTags } from "@/lib/actions/notes"
import { TagsView } from "./tags-view"

export default async function TagsPage() {
  const tags = await getTags()

  return <TagsView tags={tags} />
}
