import { reportBrowserError } from "@/lib/telemetry-client"

window.addEventListener("error", () => reportBrowserError("uncaught"))
window.addEventListener("unhandledrejection", () => reportBrowserError("unhandled_rejection"))
