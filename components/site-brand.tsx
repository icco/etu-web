import Image from "next/image"
import Link from "next/link"

export function SiteBrand() {
  return (
    <Link href="/" className="btn btn-ghost text-xl gap-2">
      <Image src="/logo.svg" alt="" width={28} height={28} priority />
      Etu
    </Link>
  )
}
