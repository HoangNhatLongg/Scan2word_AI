import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { comparePassword, generateToken, setAuthCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Tài khoản đã bị khóa' },
        { status: 403 }
      )
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const cookies = setAuthCookie(token)

    const response = NextResponse.json(
      {
        message: 'Đăng nhập thành công',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      }
    )

    cookies.forEach(cookie => {
      response.cookies.set(cookie)
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
