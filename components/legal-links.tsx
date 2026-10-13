import Link from "next/link"

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
]

export function LegalLinks() {
  return (
    <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-12 text-sm text-base-content/70">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-base-content">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
