"use client"

import { ThemeToggle } from "@/components/theme-toggle"

export function Footer() {
  return (
    <footer className="flex items-center justify-center gap-4 text-sm opacity-60 py-4 bg-base-100">
      <span>&copy; 2026 <a href="https://natwelch.com" className="link link-hover">Nat Welch</a>.</span>
      <ThemeToggle />
    </footer>
  )
}
