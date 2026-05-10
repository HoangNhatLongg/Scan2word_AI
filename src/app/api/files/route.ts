import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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
    const search = searchParams.get('search') || ''

    const where = search ? {
      OR: [
        { fileName: { contains: search } },
        { ocrResult: { extractedText: { contains: search } } },
      ],
    } : {}

    const [files, total] = await Promise.all([
      prisma.exportFile.findMany({
        where,
        include: {
          ocrResult: {
            include: {
              image: {
                select: { fileName: true, filePath: true }
              }
            }
          },
          user: {
            select: { id: true, fullName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.exportFile.count({ where }),
    ])

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing file id' }, { status: 400 })
    }

    await prisma.exportFile.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Xóa file thành công' })
  } catch (error) {
    console.error('Delete file error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
