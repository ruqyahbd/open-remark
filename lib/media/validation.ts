import { ApiError } from "@/lib/api/error"

export const ALLOWED_IMAGE_HOSTS = ["ibb.co", "catbox.moe"]

export function assertImageUrlsAllowed(imageUrls: string[]) {
  for (const u of imageUrls) {
    const host = new URL(u).hostname.toLowerCase()
    const allowed = ALLOWED_IMAGE_HOSTS.some(
      (h) => host === h || host.endsWith("." + h)
    )
    if (!allowed) throw new ApiError("Image host not allowed", 400)
  }
}
