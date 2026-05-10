import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const authHeader = (await import('next/headers').then(h => h.headers())).get('cookie')
    const token = authHeader?.split('auth_token=')?.[1]?.split(';')?.[0]
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      totalUsers,
      totalImages,
      totalExports,
      recentUsers,
      recentImages,
      recentExports,
      guestImages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.uploadedImage.count(),
      prisma.exportFile.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, createdAt: true },
      }),
      prisma.uploadedImage.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
        },
      }),
      prisma.exportFile.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
        },
      }),
      prisma.uploadedImage.findMany({
        where: { userId: null },
        select: { id: true, fileName: true, createdAt: true },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalUsers,
        totalImages,
        totalExports,
        guestImages: guestImages.length,
      },
      recentUsers,
      recentImages,
      recentExports,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
