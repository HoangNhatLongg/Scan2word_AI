import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { fullName, email, password } = validation.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: 'user',
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const cookies = setAuthCookie(token)

    const response = NextResponse.json(
      {
        message: 'Đăng ký thành công',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    )

    cookies.forEach(cookie => {
      response.cookies.set(cookie)
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
