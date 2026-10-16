import { ApiError } from "@/lib/api/error"

export type UploadResult = {
  url: string
  thumbUrl: string
}

export type UploadInput = {
  buffer: Buffer
  filename: string
  mime: string
  apiKey?: string | null
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export function validateImageFile(
  buffer: Buffer,
  mime: string,
  maxBytes: number
) {
  if (buffer.length > maxBytes) {
    throw new ApiError(
      `Image exceeds maximum allowed size of ${(maxBytes / (1024 * 1024)).toFixed(1)}MB`,
      413
    )
  }
  if (!ALLOWED_MIME_TYPES.has(mime.toLowerCase())) {
    throw new ApiError(
      "Unsupported image type. Allowed formats: JPG, PNG, WebP, GIF",
      422
    )
  }
}

export async function uploadToCatbox(
  input: UploadInput
): Promise<UploadResult> {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  const bytes = new Uint8Array(input.buffer)
  form.append(
    "fileToUpload",
    new Blob([bytes], { type: input.mime }),
    input.filename
  )

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: form,
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    throw new ApiError("Catbox upload failed, please try again", 502)
  }

  const text = (await res.text()).trim()
  if (!text.startsWith("http")) {
    throw new ApiError(`Catbox upload failed: ${text}`, 502)
  }

  return { url: text, thumbUrl: text }
}

export async function uploadToImgbb(input: UploadInput): Promise<UploadResult> {
  if (!input.apiKey) {
    throw new ApiError("ImgBB API key is not configured for this site", 400)
  }

  const form = new FormData()
  const bytes = new Uint8Array(input.buffer)
  form.append("image", new Blob([bytes], { type: input.mime }), input.filename)
  form.append("name", input.filename)

  const url = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(input.apiKey)}`
  const res = await fetch(url, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    throw new ApiError("ImgBB upload failed, please try again", 502)
  }

  const json = (await res.json().catch(() => null)) as {
    data?: {
      url?: string
      display_url?: string
      thumb?: { url?: string }
    }
  } | null

  const fileUrl = json?.data?.url ?? json?.data?.display_url
  if (!fileUrl) {
    throw new ApiError("ImgBB rejected the image", 502)
  }

  return {
    url: fileUrl,
    thumbUrl: json?.data?.thumb?.url ?? fileUrl,
  }
}

export async function uploadToImgur(input: UploadInput): Promise<UploadResult> {
  if (!input.apiKey) {
    throw new ApiError("Imgur Client-ID is not configured for this site", 400)
  }

  const clientId = input.apiKey.trim().replace(/^Client-ID\s+/i, "")

  const form = new FormData()
  const bytes = new Uint8Array(input.buffer)
  form.append("image", new Blob([bytes], { type: input.mime }), input.filename)
  form.append("type", "file")
  form.append("name", input.filename)

  const res = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: `Client-ID ${clientId}`,
    },
    body: form,
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as {
      data?: { error?: string | { message?: string } }
    } | null
    const msg =
      typeof err?.data?.error === "string"
        ? err.data.error
        : (err?.data?.error?.message ?? "Imgur upload failed, please try again")
    throw new ApiError(
      `Imgur upload failed: ${msg}`,
      res.status >= 500 ? 502 : 400
    )
  }

  const json = (await res.json().catch(() => null)) as {
    data?: {
      id?: string
      link?: string
    }
    success?: boolean
  } | null

  const link = json?.data?.link
  if (!link) {
    throw new ApiError("Imgur did not return an image link", 502)
  }

  let thumbUrl = link
  if (json?.data?.id) {
    const extMatch = link.match(/\.([a-z0-9]+)$/i)
    const ext = extMatch ? extMatch[1] : "jpg"
    thumbUrl = `https://i.imgur.com/${json.data.id}m.${ext}`
  }

  return {
    url: link,
    thumbUrl,
  }
}
