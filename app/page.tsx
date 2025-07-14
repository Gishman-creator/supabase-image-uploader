"use client"

import React, { useState, FormEvent, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, ExternalLink, CheckCircle, AlertCircle, Copy, Image as ImageIcon } from "lucide-react"
import { uploadImageFromUrl } from "./actions"

export default function ImageUploader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [bucketName, setBucketName] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    publicUrl?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const bucketFromUrl = searchParams.get("bucket")
    if (bucketFromUrl) {
      setBucketName(bucketFromUrl)
    }
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!bucketName.trim() || !imageUrl.trim()) {
      setResult({
        success: false,
        message: "Please provide both bucket name and image URL",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await uploadImageFromUrl(bucketName.trim(), imageUrl.trim())
      setResult(response)

      if (response.success) {
        // Update URL with bucket name
        const params = new URLSearchParams(searchParams.toString())
        params.set("bucket", bucketName.trim())
        router.push(`${pathname}?${params.toString()}`)
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Image Uploader</h1>
          <p className="text-gray-600">Upload images from URLs directly to your Supabase Storage bucket</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Image from URL
                </CardTitle>
                <CardDescription>
                  Enter a bucket name and image URL to download and upload the image to Supabase Storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bucketName">Bucket Name</Label>
                    <Input
                      id="bucketName"
                      type="text"
                      placeholder="e.g., avatars, images, uploads"
                      value={bucketName}
                      onChange={(e) => setBucketName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                      {result.message}
                    </AlertDescription>

                    {result.success && result.publicUrl && (
                      <div className="mt-3">
                        <div className="group flex items-center justify-between mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            <a
                              href={result.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {result.publicUrl}
                            </a>
                          <div className="flex items-center shrink-0 pl-2">
                            <a
                              href={result.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-gray-200"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-4 w-4 text-gray-600" />
                            </a>
                            <button
                              onClick={() => handleCopy(result.publicUrl!)}
                              className="p-1 rounded hover:bg-gray-200"
                              title={copied ? "Copied!" : "Copy URL"}
                            >
                              {copied ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </div>

          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Image preview"
                      className="rounded-md object-contain max-h-full max-w-full"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const placeholder = parent.querySelector(".placeholder-icon")
                          if (placeholder) {
                            ;(placeholder as HTMLElement).style.display = "flex"
                          }
                        }
                      }}
                      onLoad={(e) => {
                        e.currentTarget.style.display = "block"
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          const placeholder = parent.querySelector(".placeholder-icon")
                          if (placeholder) {
                            ;(placeholder as HTMLElement).style.display = "none"
                          }
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="placeholder-icon"
                    style={{ display: imageUrl ? "none" : "flex" }}
                  >
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Make sure your Supabase bucket exists and has the appropriate permissions configured.</p>
        </div>
      </div>
    </div>
  )
}
