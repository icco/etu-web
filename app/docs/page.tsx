import { readFile } from "fs/promises"
import { join } from "path"
import { marked } from "marked"
import DOMPurify from "isomorphic-dompurify"

export const metadata = {
  title: "API Documentation - Etu Server",
  description: "Complete REST API documentation for Etu Server",
}

export default async function DocsPage() {
  // Read the API.md file
  const apiMdPath = join(process.cwd(), "API.md")
  const content = await readFile(apiMdPath, "utf-8")
  
  // Convert markdown to HTML
  const rawHtml = await marked(content)
  const sanitizedHtml = DOMPurify.sanitize(rawHtml)

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-base-100 rounded-lg shadow-lg p-6 md:p-8">
          <div 
            className="prose prose-sm md:prose-base lg:prose-lg max-w-none
                       prose-headings:text-base-content
                       prose-p:text-base-content/90
                       prose-a:text-primary hover:prose-a:text-primary-focus
                       prose-code:text-accent prose-code:bg-base-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                       prose-pre:bg-base-300 prose-pre:border prose-pre:border-base-content/10
                       prose-table:border prose-table:border-base-content/20
                       prose-th:bg-base-200 prose-th:border prose-th:border-base-content/20
                       prose-td:border prose-td:border-base-content/20"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      </div>
    </div>
  )
}
