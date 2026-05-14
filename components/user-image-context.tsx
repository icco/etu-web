"use client"

import { createContext, use } from "react"

export interface UserImageInfo {
  key: string
  version: string
}

const UserImageContext = createContext<UserImageInfo | undefined>(undefined)

export function UserImageProvider({
  image,
  updatedAt,
  children,
}: {
  image?: string | null
  updatedAt?: Date | null
  children: React.ReactNode
}) {
  const value: UserImageInfo | undefined = image
    ? { key: image, version: String(updatedAt ? updatedAt.getTime() : 0) }
    : undefined
  return <UserImageContext value={value}>{children}</UserImageContext>
}

export function useUserImage() {
  return use(UserImageContext)
}
