import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { text, confidence, source } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Get user from token
    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')?.[1]?.split(';')?.[0]
    let userId: number | null = null
    
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        userId = payload.userId
      }
    }

    // Create OCR result without image (for Tesseract which doesn't save image)
    const ocrResult = await prisma.oCRResult.create({
      data: {
        imageId: 0, // Tesseract doesn't have associated image
        userId: userId,
        extractedText: text,
        formattedContent: text,
        confidence: confidence || 0.8,
        language: 'vie',
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      ocrResultId: ocrResult.id,
    })
  } catch (error) {
    console.error('Save OCR result error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
