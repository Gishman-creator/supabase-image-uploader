"use server"

import { createClient } from "@supabase/supabase-js"

export async function uploadImageFromUrl(bucketName: string, imageUrl: string) {
  // ① Ensure Supabase credentials exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return {
      success: false,
      message:
        "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment.",
    }
  }

  // ② Create the client only after validation
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    // Validate URL format
    let url: URL
    try {
      url = new URL(imageUrl)
    } catch {
      return {
        success: false,
        message: "Invalid URL format",
      }
    }

    // Fetch the image from the URL
    const response = await fetch(imageUrl)

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to fetch image: ${response.status} ${response.statusText}`,
      }
    }

    // Check if the response is actually an image
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.startsWith("image/")) {
      return {
        success: false,
        message: "URL does not point to a valid image",
      }
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const imageFile = new Uint8Array(imageBuffer)

    // Generate a unique filename
    const timestamp = Date.now()
    const urlPath = url.pathname
    const extension = urlPath.split(".").pop() || "jpg"
    const filename = `image_${timestamp}.${extension}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(bucketName).upload(filename, imageFile, {
      contentType: contentType,
      upsert: false,
    })

    if (error) {
      console.error("Supabase upload error:", error)

      // Handle specific error cases
      if (error.message.includes("Bucket not found")) {
        return {
          success: false,
          message: `Bucket "${bucketName}" not found. Please create the bucket first.`,
        }
      }

      if (error.message.includes("not allowed")) {
        return {
          success: false,
          message: "Upload not allowed. Check your bucket permissions.",
        }
      }

      return {
        success: false,
        message: `Upload failed: ${error.message}`,
      }
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filename)

    return {
      success: true,
      message: `Image uploaded successfully as ${filename}`,
      publicUrl: publicUrlData.publicUrl,
    }
  } catch (error) {
    console.error("Upload error:", error)
    return {
      success: false,
      message: "An unexpected error occurred during upload",
    }
  }
}
