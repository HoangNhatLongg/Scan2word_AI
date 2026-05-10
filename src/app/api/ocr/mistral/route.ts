import { NextResponse } from 'next/server'

type MistralError = {
  error: string
  status?: number
}

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json()

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

    const imageUrl = normalizeImageDataUrl(imageBase64)
    const ocrResult = await processMistralOCR(imageUrl, apiKey)

    if ('error' in ocrResult) {
      return NextResponse.json(ocrResult, { status: ocrResult.status || 500 })
    }

    return ocrResult
  } catch (error: any) {
    console.error('Mistral OCR Error:', error)

    if (error.status === 401) {
      return NextResponse.json({ error: 'API key Mistral khong hop le' }, { status: 401 })
    }

    if (error.status === 429) {
      return NextResponse.json({ error: 'Da vuot qua gioi han su dung Mistral API' }, { status: 429 })
    }

    return NextResponse.json(
      { error: error.message || 'Loi khi xu ly voi Mistral AI', details: error.code || error.name },
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

async function processMistralOCR(imageUrl: string, apiKey: string): Promise<NextResponse | MistralError> {
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

  const parsedData = await ocrResponse.json()

  let extractedText = ''
  if (Array.isArray(parsedData.pages)) {
    for (const page of parsedData.pages) {
      if (page.markdown) {
        extractedText += `${page.markdown}\n\n`
      }
    }
  }

  extractedText = extractedText.trim()
  if (!extractedText) {
    return { error: 'Khong tim thay van ban trong hinh anh', status: 404 }
  }

  const formattedText = formatText(extractedText)
  if (!hasReadableText(formattedText)) {
    return { error: 'Khong tim thay chu doc duoc trong hinh anh', status: 404 }
  }

  const confidence = getAveragePageConfidence(parsedData)

  return NextResponse.json({
    success: true,
    extractedText: formattedText,
    rawText: extractedText,
    source: 'mistral',
    confidence,
  })
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

function formatText(text: string): string {
  let formatted = text.replace(/\n{3,}/g, '\n\n')
  formatted = formatted.replace(/0(?=[a-zA-Z])/g, 'O').replace(/1(?=[a-zA-Z])/g, 'l')
  return formatted.trim()
}

function hasReadableText(text: string): boolean {
  const readableCharacters = text.replace(/[|\-_:*\s.,;()[\]{}"'`~!@#$%^&+=\\/<>?]/g, '')
  return readableCharacters.length > 0
}
