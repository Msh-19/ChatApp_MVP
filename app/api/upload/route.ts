import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
// Method 1: Use CLOUDINARY_URL (format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
// Method 2: Use individual variables
if (process.env.CLOUDINARY_URL) {
  // Parse CLOUDINARY_URL
  const url = new URL(process.env.CLOUDINARY_URL)
  cloudinary.config({
    cloud_name: url.hostname,
    api_key: url.username,
    api_secret: url.password,
  })
  console.log('✅ Cloudinary configured with URL (cloud:', url.hostname, ')')
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Use individual env vars
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  console.log('✅ Cloudinary configured with individual vars')
} else {
  console.error('❌ Cloudinary not configured! Set CLOUDINARY_URL or individual credentials')
  throw new Error('Cloudinary configuration missing')
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 Upload request received')
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('❌ No file in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('📤 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Convert file to base64 for Cloudinary upload
    // This is more reliable than streaming for Next.js API routes
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64}`

    console.log('📦 File converted to base64, length:', base64.length)

    // Determine resource type based on file type
    let resourceType: 'image' | 'video' = 'image'
    
    if (file.type.startsWith('image/')) {
      resourceType = 'image'
    } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      resourceType = 'video'
    } else {
        // Reject non-media files
        console.error('❌ Unsupported file type:', file.type)
        return NextResponse.json({ error: 'Only media files (images, audio, video) are allowed' }, { status: 400 })
    }

    console.log('📂 Resource type:', resourceType)

    // Upload to Cloudinary using base64 data URI
    // This is the recommended approach for server-side uploads
    const uploadOptions: any = {
      resource_type: resourceType,
      folder: 'chat-attachments',
    }

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions)

    console.log('✅ Upload successful!', {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      type: file.type,
      size: file.size,
      name: file.name,
    })
  } catch (error: any) {
    console.error('❌ Upload error:', {
      message: error.message,
      stack: error.stack,
      details: error
    })
    return NextResponse.json(
      { error: 'Upload failed: ' + error.message },
      { status: 500 }
    )
  }
}
