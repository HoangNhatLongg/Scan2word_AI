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
    const type = searchParams.get('type') || 'all' // 'all' | 'uploadedImages' | 'ocrResults' | 'exportFiles'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''

    let data: any[] = []
    let total = 0

    if (type === 'uploadedImages' || type === 'all') {
      const where = search ? {
        OR: [
          { fileName: { contains: search } },
          { user: { fullName: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      } : {}

      const result = await prisma.uploadedImage.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true }
          },
          ocrResults: {
            select: { id: true, extractedText: true, createdAt: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'uploadedImages' ? skip : 0,
        take: type === 'uploadedImages' ? limit : 5,
      })

      if (type === 'uploadedImages') {
        data = result.map(img => ({
          id: img.id,
          type: 'uploadedImage',
          fileName: img.fileName,
          fileSize: img.fileSize,
          mimeType: img.mimeType,
          status: img.status,
          createdAt: img.createdAt,
          user: img.user,
          ocrResult: img.ocrResults[0] || null,
        }))
        total = await prisma.uploadedImage.count({ where })
      } else {
        data = result.map(img => ({
          id: img.id,
          type: 'uploadedImage',
          fileName: img.fileName,
          fileSize: img.fileSize,
          mimeType: img.mimeType,
          status: img.status,
          createdAt: img.createdAt,
          user: img.user,
        }))
      }
    }

    if (type === 'ocrResults' || type === 'all') {
      const where = search ? {
        OR: [
          { extractedText: { contains: search } },
          { user: { fullName: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      } : {}

      const results = await prisma.oCRResult.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true }
          },
          image: {
            select: { fileName: true, filePath: true }
          },
          exportFiles: {
            select: { id: true, fileName: true, fileType: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'ocrResults' ? skip : 0,
        take: type === 'ocrResults' ? limit : 5,
      })

      const ocrData = results.map(ocr => ({
        id: ocr.id,
        type: 'ocrResult',
        extractedText: ocr.extractedText.substring(0, 200) + (ocr.extractedText.length > 200 ? '...' : ''),
        confidence: ocr.confidence,
        language: ocr.language,
        status: ocr.status,
        createdAt: ocr.createdAt,
        user: ocr.user,
        image: ocr.image,
        exportFiles: ocr.exportFiles,
      }))

      if (type === 'ocrResults') {
        data = ocrData
        total = await prisma.oCRResult.count({ where })
      } else if (type === 'all') {
        data = [...data, ...ocrData].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5)
      }
    }

    if (type === 'exportFiles' || type === 'all') {
      const where = search ? {
        OR: [
          { fileName: { contains: search } },
          { user: { fullName: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      } : {}

      const results = await prisma.exportFile.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true }
          },
          ocrResult: {
            select: { id: true, extractedText: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'exportFiles' ? skip : 0,
        take: type === 'exportFiles' ? limit : 5,
      })

      const exportData = results.map(exp => ({
        id: exp.id,
        type: 'exportFile',
        fileName: exp.fileName,
        fileType: exp.fileType,
        fileSize: exp.fileSize,
        createdAt: exp.createdAt,
        user: exp.user,
        ocrResult: exp.ocrResult,
      }))

      if (type === 'exportFiles') {
        data = exportData
        total = await prisma.exportFile.count({ where })
      } else if (type === 'all') {
        data = [...data, ...exportData].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5)
      }
    }

    if (type === 'all') {
      total = await Promise.all([
        prisma.uploadedImage.count(),
        prisma.oCRResult.count(),
        prisma.exportFile.count(),
      ]).then(([a, b, c]) => a + b + c)
    }

    return NextResponse.json({
      files: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        uploadedImages: await prisma.uploadedImage.count(),
        ocrResults: await prisma.oCRResult.count(),
        exportFiles: await prisma.exportFile.count(),
      },
    })
  } catch (error) {
    console.error('Get files error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
