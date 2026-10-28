import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

// Stop propagation so the clickable note card does not swallow link clicks.
const components: Components = {
  a: ({ node: _node, ...props }) =>
    props.href?.startsWith("#") ? (
      <a {...props} onClick={(e) => e.stopPropagation()} />
    ) : (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      />
    ),
}

export default function NoteMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
