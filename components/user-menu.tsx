"use client"

import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline"
import { signOut } from "next-auth/react"

export function UserMenu() {
  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm btn-square">
        <UserCircleIcon className="h-6 w-6" />
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
      >
        <li>
          <a href="/settings">
            <Cog6ToothIcon className="h-4 w-4" />
            Settings
          </a>
        </li>
        <li>
          <button onClick={() => signOut({ callbackUrl: "/" })}>
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </li>
      </ul>
    </div>
  )
}
