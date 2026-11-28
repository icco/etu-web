import { test, expect } from "@playwright/test"
import { clientIpFromHeaders } from "../lib/client-ip"

test("trusts only the last X-Forwarded-For hop", () => {
  expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("5.6.7.8")
})

test("rejects a forwarded value that is not an IP", () => {
  expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "garbage" }))).toBeUndefined()
})
