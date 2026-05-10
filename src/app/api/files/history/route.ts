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
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = {
      OR: [
        { userId: payload.userId },
        { sessionId: searchParams.get('sessionId') || undefined },
      ],
    }

    const [results, total] = await Promise.all([
      prisma.oCRResult.findMany({
        where,
        include: {
          image: {
            select: {
              id: true,
              fileName: true,
              filePath: true,
              fileSize: true,
              createdAt: true,
            }
          },
          exportFiles: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.oCRResult.count({ where }),
    ])

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
