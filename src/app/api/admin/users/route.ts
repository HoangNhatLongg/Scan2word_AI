import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { updateUserSchema } from '@/lib/validations'

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
        { fullName: { contains: search } },
        { email: { contains: search } },
      ],
    } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              uploadedImages: true,
              ocrResults: true,
              exportFiles: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
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

    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: validation.data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      message: 'Cập nhật thành công',
      user,
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
