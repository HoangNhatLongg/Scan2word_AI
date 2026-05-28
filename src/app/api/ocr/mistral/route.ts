import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

type MistralError = {
  error: string
  status?: number
}

export async function POST(request: Request) {
  try {
    const { imageBase64, fileName } = await request.json()

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Khong co du lieu hinh anh' },
        { status: 400 }
      )
    }

    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'MISTRAL_API_KEY chua duoc cau hinh' },
        { status: 500 }
      )
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

    // Detect image type
    let mimeType = 'image/jpeg'
    if (imageBase64.includes('data:image/png')) {
      mimeType = 'image/png'
    } else if (imageBase64.includes('data:image/webp')) {
      mimeType = 'image/webp'
    }

    // Create upload directory if not exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Save uploaded image to database and file system
    const ext = mimeType.split('/')[1]
    const savedFileName = `img_${Date.now()}.${ext}`
    const filePath = path.join(UPLOAD_DIR, savedFileName)
    const fileUrl = `/uploads/${savedFileName}`

    // Extract base64 data
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')
    
    await writeFile(filePath, imageBuffer)

    // Save to UploadedImage table
    const uploadedImage = await prisma.uploadedImage.create({
      data: {
        userId: userId,
        fileName: fileName || savedFileName,
        filePath: fileUrl,
        fileSize: imageBuffer.length,
        mimeType: mimeType,
        status: 'processing',
      },
    })

    // Process OCR with Mistral
    const imageUrl = normalizeImageDataUrl(imageBase64)
    const ocrResult = await processMistralOCR(imageUrl, apiKey)

    if ('error' in ocrResult) {
      // Update status to failed
      await prisma.uploadedImage.update({
        where: { id: uploadedImage.id },
        data: { status: 'failed' },
      })
      return NextResponse.json(ocrResult, { status: ocrResult.status || 500 })
    }

    // Extract text from OCR response
    let extractedText = ''
    if (Array.isArray(ocrResult.pages)) {
      for (const page of ocrResult.pages) {
        if (page.markdown) {
          extractedText += `${page.markdown}\n\n`
        }
      }
    }

    extractedText = extractedText.trim()
    if (!extractedText) {
      await prisma.uploadedImage.update({
        where: { id: uploadedImage.id },
        data: { status: 'failed' },
      })
      return NextResponse.json({ error: 'Khong tim thay van ban trong hinh anh' }, { status: 404 })
    }

    const confidence = getAveragePageConfidence(ocrResult)

    // Save OCR result to database
    const savedOcrResult = await prisma.oCRResult.create({
      data: {
        imageId: uploadedImage.id,
        userId: userId,
        extractedText: extractedText,
        formattedContent: extractedText,
        confidence: confidence / 100,
        language: 'vie',
        status: 'completed',
      },
    })

    // Update uploaded image status
    await prisma.uploadedImage.update({
      where: { id: uploadedImage.id },
      data: { status: 'processed' },
    })

    return NextResponse.json({
      success: true,
      extractedText: extractedText,
      rawText: extractedText,
      source: 'mistral',
      confidence: confidence,
      ocrResultId: savedOcrResult.id,
      imageId: uploadedImage.id,
    })
  } catch (error: any) {
    console.error('Mistral OCR Error:', error)
    return NextResponse.json(
      { error: error.message || 'Loi khi xu ly voi Mistral AI' },
      { status: 500 }
    )
  }
}

function normalizeImageDataUrl(imageBase64: string) {
  if (imageBase64.startsWith('data:image/')) {
    return imageBase64.replace(/[\r\n]/g, '')
  }
  return `data:image/jpeg;base64,${imageBase64.replace(/[\r\n]/g, '')}`
}

async function processMistralOCR(imageUrl: string, apiKey: string): Promise<any | MistralError> {
  const ocrResponse = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        image_url: imageUrl,
      },
      include_image_base64: false,
    }),
  })

  if (!ocrResponse.ok) {
    const errorText = await ocrResponse.text()
    console.error('Mistral OCR API error:', ocrResponse.status, errorText)
    return {
      error: `Loi OCR Mistral: ${ocrResponse.status} - ${errorText}`,
      status: ocrResponse.status,
    }
  }

  return await ocrResponse.json()
}

function getAveragePageConfidence(parsedData: any): number {
  const pageScores = parsedData.pages
    ?.map((page: any) => page.confidence_scores?.average_page_confidence_score)
    .filter((score: unknown): score is number => typeof score === 'number')

  if (!pageScores?.length) {
    return 95
  }

  return (pageScores.reduce((sum: number, score: number) => sum + score, 0) / pageScores.length) * 100
}
