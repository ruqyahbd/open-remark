import { ApiError } from "@/lib/api/error"
import type { MediaProvider } from "@/generated/prisma/enums"
import {
  validateImageFile,
  uploadToCatbox,
  uploadToImgbb,
  uploadToImgur,
  type UploadResult,
} from "@/lib/media/providers"

export const ALLOWED_IMAGE_HOSTS = [
  "catbox.moe",
  "files.catbox.moe",
  "ibb.co",
  "i.ibb.co",
  "imgur.com",
  "i.imgur.com",
]

export function assertImageUrlsAllowed(imageUrls: string[]) {
  for (const u of imageUrls) {
    try {
      const host = new URL(u).hostname.toLowerCase()
      const allowed = ALLOWED_IMAGE_HOSTS.some(
        (h) => host === h || host.endsWith("." + h)
      )
      if (!allowed) throw new ApiError("Image host not allowed", 400)
    } catch (e) {
      if (e instanceof ApiError) throw e
      throw new ApiError("Invalid image URL", 400)
    }
  }
}

export async function uploadMedia(input: {
  site: {
    id: string
    mediaEnabled: boolean
    mediaProvider: MediaProvider
    mediaApiKey: string | null
    mediaMaxBytes: number
  }
  buffer: Buffer
  filename: string
  mime: string
}): Promise<UploadResult> {
  const { site, buffer, filename, mime } = input

  if (!site.mediaEnabled) {
    throw new ApiError("Image uploads are disabled on this site", 403)
  }

  validateImageFile(buffer, mime, site.mediaMaxBytes)

  switch (site.mediaProvider) {
    case "IMGUR":
      return uploadToImgur({ buffer, filename, mime, apiKey: site.mediaApiKey })
    case "IMGBB":
      return uploadToImgbb({ buffer, filename, mime, apiKey: site.mediaApiKey })
    case "CATBOX":
    default:
      return uploadToCatbox({ buffer, filename, mime })
  }
}
