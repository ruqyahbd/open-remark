"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateSite } from "@/lib/queries/sites"
import type { Site } from "./types"

type Props = {
  site: Site
}

export function MediaUploadSection({ site }: Props) {
  const updateSite = useUpdateSite(site.id)
  const [enabled, setEnabled] = useState(site.mediaEnabled ?? false)
  const [provider, setProvider] = useState<"CATBOX" | "IMGBB" | "IMGUR">(
    site.mediaProvider ?? "CATBOX"
  )
  const [apiKey, setApiKey] = useState(site.mediaApiKey ?? "")

  function handleSave(e: React.FormEvent) {
    e.preventDefault()

    updateSite.mutate(
      {
        mediaEnabled: enabled,
        mediaProvider: provider,
        mediaApiKey: provider === "CATBOX" ? null : apiKey.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Media upload settings saved")
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Media Upload</CardTitle>
        <CardDescription>
          Allow visitors to upload and attach images to comments. Images are
          displayed as compact thumbnails and expand into a full lightbox on
          click.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="media-enabled" className="text-sm font-medium">
                Enable Image Attachments
              </Label>
              <p className="text-xs text-muted-foreground">
                Allows up to 4 images per comment (max 5MB each).
              </p>
            </div>
            <Switch
              id="media-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <div className="flex flex-col gap-4 pt-1">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="media-provider">Storage Provider</Label>
                <Select
                  value={provider}
                  onValueChange={(val) =>
                    setProvider(val as "CATBOX" | "IMGBB" | "IMGUR")
                  }
                >
                  <SelectTrigger id="media-provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CATBOX">
                      Catbox.moe (Zero Setup)
                    </SelectItem>
                    <SelectItem value="IMGUR">
                      Imgur (Requires Client-ID)
                    </SelectItem>
                    <SelectItem value="IMGBB">
                      ImgBB (Requires API Key)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {provider === "CATBOX" &&
                    "Catbox hosts images permanently with zero configuration or API keys required."}
                  {provider === "IMGUR" &&
                    "Imgur provides reliable high-speed hosting worldwide using an official Client-ID."}
                  {provider === "IMGBB" &&
                    "ImgBB requires a free API key and provides fast worldwide image delivery."}
                </p>
              </div>

              {provider === "IMGUR" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="media-api-key">Imgur Client-ID</Label>
                  <Input
                    id="media-api-key"
                    type="password"
                    placeholder="Enter your Imgur Client-ID"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required={provider === "IMGUR"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get a free Client-ID at{" "}
                    <a
                      href="https://api.imgur.com/oauth2/add"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:opacity-80"
                    >
                      api.imgur.com/oauth2/add
                    </a>{" "}
                    (select &ldquo;OAuth 2 authorization without a callback
                    URL&rdquo;).
                  </p>
                </div>
              )}

              {provider === "IMGBB" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="media-api-key">ImgBB API Key</Label>
                  <Input
                    id="media-api-key"
                    type="password"
                    placeholder="Enter your ImgBB API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required={provider === "IMGBB"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get a free API key at{" "}
                    <a
                      href="https://api.imgbb.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:opacity-80"
                    >
                      api.imgbb.com
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={updateSite.isPending}
            className="w-fit"
          >
            {updateSite.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
