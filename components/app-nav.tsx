"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileTextIcon,
  ClockIcon,
  SearchIcon,
  TagIcon,
} from "lucide-react"

const navLinks = [
  { href: "/notes", label: "Notes", icon: FileTextIcon },
  { href: "/history", label: "History", icon: ClockIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/tags", label: "Tags", icon: TagIcon },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname?.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={`btn btn-ghost btn-sm gap-1 ${isActive ? "btn-active" : ""}`}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
