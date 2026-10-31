"use client"

import { createContext, use } from "react"

const UserImageContext = createContext<string | null>(null)

export function UserImageProvider({
  image,
  children,
}: {
  image: string | null
  children: React.ReactNode
}) {
  return <UserImageContext value={image}>{children}</UserImageContext>
}

export function useUserImage() {
  return use(UserImageContext)
}
