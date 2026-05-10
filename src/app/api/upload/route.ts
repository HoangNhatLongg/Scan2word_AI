import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const sessionId = formData.get('sessionId') as string | null
    
    // Get user from token if logged in
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')?.[1]?.split(';')?.[0]
    let userId: number | null = null
    
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        userId = payload.userId
      }
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file nào được tải lên' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Chỉ hỗ trợ file JPG, PNG' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File quá lớn. Tối đa 10MB' },
        { status: 400 }
      )
    }

    // Create upload directory if not exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = path.extname(file.name)
    const fileName = `${timestamp}_${randomStr}${ext}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save to database
    const uploadedImage = await prisma.uploadedImage.create({
      data: {
        userId,
        sessionId: userId ? null : sessionId,
        fileName: file.name,
        filePath: `/uploads/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        status: 'pending',
      },
    })

    return NextResponse.json({
      message: 'Upload thành công',
      image: {
        id: uploadedImage.id,
        fileName: uploadedImage.fileName,
        filePath: uploadedImage.filePath,
        fileSize: uploadedImage.fileSize,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')?.[1]?.split(';')?.[0]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [images, total] = await Promise.all([
      prisma.uploadedImage.findMany({
        include: {
          user: {
            select: { id: true, fullName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.uploadedImage.count(),
    ])

    return NextResponse.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get images error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
