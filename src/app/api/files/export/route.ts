import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const EXPORT_DIR = path.join(process.cwd(), 'public', 'exports')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, fileName, fileType, ocrResultId, sessionId } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Nội dung không được để trống' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('cookie')
    const token = authHeader?.split('auth_token=')?.[1]?.split(';')?.[0]
    let userId: number | null = null
    
    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        userId = payload.userId
      }
    }

    // Create export directory if not exists
    if (!existsSync(EXPORT_DIR)) {
      await mkdir(EXPORT_DIR, { recursive: true })
    }

    let filePath: string
    let fileUrl: string
    let fileSize = 0

    if (fileType === 'txt') {
      // Save as text file
      const txtFileName = `${fileName || 'document'}_${Date.now()}.txt`
      filePath = path.join(EXPORT_DIR, txtFileName)
      const content = Buffer.from(text, 'utf-8')
      await writeFile(filePath, content)
      fileUrl = `/exports/${txtFileName}`
      fileSize = content.length
    } else {
      // For docx, we'll return a special response that triggers client-side download
      // The client will generate the docx using XML format
      const docxFileName = `${fileName || 'document'}_${Date.now()}.docx`
      filePath = path.join(EXPORT_DIR, docxFileName)
      
      // Create a minimal placeholder - actual docx generation happens client-side
      // This is a workaround since docx library can have issues in Next.js
      const placeholder = Buffer.from('placeholder')
      await writeFile(filePath, placeholder)
      fileUrl = `/exports/${docxFileName}`
      fileSize = placeholder.length
    }

    // Save to database if logged in and has ocrResultId
    if (userId && ocrResultId) {
      await prisma.exportFile.create({
        data: {
          ocrResultId,
          userId,
          fileName: fileName || 'document',
          filePath: fileUrl,
          fileType: fileType || 'docx',
          fileSize: fileSize,
        },
      })
    }

    return NextResponse.json({
      message: 'Xuất file thành công',
      file: {
        fileName: fileName || 'document',
        filePath: fileUrl,
        fileType: fileType || 'docx',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
