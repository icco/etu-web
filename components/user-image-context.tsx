"use client"

import { createContext, useContext } from "react"

const UserImageContext = createContext<string | undefined>(undefined)

export function UserImageProvider({
  image,
  children,
}: {
  image?: string | null
  children: React.ReactNode
}) {
  return <UserImageContext value={image ?? undefined}>{children}</UserImageContext>
}

export function useUserImage() {
  return useContext(UserImageContext)
}
