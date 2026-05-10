import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken, clearAuthCookie } from '@/lib/auth'

export async function GET() {
  try {
    const authHeader = await import('next/headers').then(h => h.headers())
    const token = authHeader.get('cookie')?.split('auth_token=')?.[1]?.split(';')?.[0]

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ message: 'Đăng xuất thành công' })
    clearAuthCookie().forEach(cookie => {
      response.cookies.set(cookie)
    })
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
