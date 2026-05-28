'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Loader2, AlertCircle, Brain } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { ImageUpload } from '@/components/image-upload'
import { TextEditor } from '@/components/text-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { generateSessionId } from '@/lib/utils'

interface User {
  fullName: string
  email: string
  role: string
}

type OCREngine = 'tesseract' | 'mistral'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [ocrResultId, setOcrResultId] = useState<number | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sessionId, setSessionId] = useState<string>('')
  const [ocrEngine, setOcrEngine] = useState<OCREngine>('mistral')
  const { toast } = useToast()

  useEffect(() => {
    // Generate or retrieve session ID
    let sid = sessionStorage.getItem('sessionId')
    if (!sid) {
      sid = generateSessionId()
      sessionStorage.setItem('sessionId', sid)
    }
    setSessionId(sid)

    // Check if user is logged in
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE' })
      setUser(null)
      toast({
        title: 'Đăng xuất thành công',
        variant: 'success',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setExtractedText('')
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setPreview(null)
    setExtractedText('')
    setProgress(0)
  }, [])

  const handleProcessOCR = async () => {
    if (!selectedFile || !preview) return

    setIsProcessing(true)
    setProgress(0)

    try {
      let result = { text: '', confidence: 0, source: '' }

      if (ocrEngine === 'mistral') {
        // Use Mistral AI OCR
        setProgress(20)
        
        const response = await fetch('/api/ocr/mistral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: await prepareImageForOCR(preview),
            fileName: selectedFile.name 
          }),
        })

        setProgress(70)

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Lỗi khi xử lý với Mistral AI')
        }

        result = { 
          text: data.extractedText, 
          confidence: data.confidence,
          source: 'mistral'
        }
        
        // Save OCR result ID for export tracking
        if (data.ocrResultId) {
          setOcrResultId(data.ocrResultId)
        }
      } else {
        // Use Tesseract.js (fallback)
        const { createWorker } = await import('tesseract.js')
        
        const worker = await createWorker('vie+eng', 1, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 80))
            }
          },
        })

        const { data } = await worker.recognize(preview)
        await worker.terminate()

        result = { 
          text: data.text, 
          confidence: data.confidence,
          source: 'tesseract'
        }
        
        // Save OCR result for Tesseract
        try {
          const saveRes = await fetch('/api/ocr/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: data.text,
              confidence: data.confidence / 100,
              source: 'tesseract',
            }),
          })
          const saveData = await saveRes.json()
          if (saveData.ocrResultId) {
            setOcrResultId(saveData.ocrResultId)
          }
        } catch (e) {
          console.error('Failed to save Tesseract result:', e)
        }
      }

      setProgress(100)

      if (result.text.trim()) {
        setExtractedText(result.text)
        
        const engineName = ocrEngine === 'mistral' ? 'Mistral AI' : 'Tesseract OCR'
        toast({
          title: 'Nhận diện thành công',
          description: `Sử dụng ${engineName} - Độ chính xác: ~${Math.round(result.confidence)}%`,
          variant: 'success',
        })
      } else {
        toast({
          title: 'Không tìm thấy văn bản',
          description: 'Vui lòng thử với hình ảnh khác hoặc chuyển engine OCR',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('OCR Error:', error)
      toast({
        title: 'Lỗi nhận diện',
        description: error.message || 'Đã xảy ra lỗi trong quá trình xử lý',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="container py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Powered by AI OCR</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Chuyển chữ viết tay
              <br />
              <span className="text-primary">sang file Word</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tải ảnh chứa chữ viết tay hoặc chữ in lên, AI sẽ tự động nhận diện
              và chuyển đổi thành file Word có thể chỉnh sửa
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  Tải ảnh lên
                </CardTitle>
                <CardDescription>
                  Hỗ trợ JPG, PNG. Tối đa 10MB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* OCR Engine Selector */}
                <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
                  <Button
                    variant={ocrEngine === 'mistral' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOcrEngine('mistral')}
                    className="flex-1"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Mistral AI
                    <span className="ml-2 text-xs opacity-70">(AI)</span>
                  </Button>
                  <Button
                    variant={ocrEngine === 'tesseract' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOcrEngine('tesseract')}
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tesseract
                    <span className="ml-2 text-xs opacity-70">(Offline)</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Mistral AI: Nhận diện tốt hơn, cần API key. Tesseract: Miễn phí, hoạt động offline.
                </p>

                <ImageUpload
                  onFileSelect={handleFileSelect}
                  currentFile={selectedFile}
                  preview={preview}
                  onClear={handleClear}
                />

                {selectedFile && (
                  <Button
                    onClick={handleProcessOCR}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xử lý... {progress}%
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Nhận diện chữ viết
                      </>
                    )}
                  </Button>
                )}

                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    Đăng nhập để lưu lịch sử chuyển đổi
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Editor Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="10" y1="9" x2="8" y2="9"/>
                  </svg>
                  Chỉnh sửa & Xuất
                </CardTitle>
                <CardDescription>
                  Chỉnh sửa nội dung trước khi xuất file
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!extractedText ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Tải ảnh lên và nhấn &quot;Nhận diện chữ viết&quot; để bắt đầu
                    </p>
                  </div>
                ) : (
                  <TextEditor
                    text={extractedText}
                    onChange={setExtractedText}
                    onExportDocx={(name) => console.log('Export DOCX:', name)}
                    onExportTxt={(name) => console.log('Export TXT:', name)}
                    originalFileName={selectedFile?.name}
                    ocrResultId={ocrResultId || undefined}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI OCR thông minh</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sử dụng công nghệ nhận diện ký tự quang học tiên tiến, hỗ trợ
                  cả chữ viết tay và chữ in với độ chính xác cao.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <CardTitle>Bảo mật & Riêng tư</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Dữ liệu của bạn được xử lý an toàn. Người dùng không đăng nhập
                  có thể sử dụng mà không cần cung cấp thông tin cá nhân.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <CardTitle>Nhanh chóng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Xử lý trong vài giây với giao diện trực quan, dễ sử dụng.
                  Xuất file Word chỉ với một cú click.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Scan2Word AI - Đề tài Trí Tuệ Nhân Tạo</p>
          <p className="mt-1">Hệ thống chuyển chữ viết tay sang file Word bằng AI</p>
        </div>
      </footer>
    </div>
  )
}

async function prepareImageForOCR(imageBase64: string): Promise<string> {
  try {
    const image = await loadImage(imageBase64)
    const sourceCanvas = document.createElement('canvas')
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })

    if (!sourceContext) {
      return imageBase64
    }

    sourceCanvas.width = image.naturalWidth
    sourceCanvas.height = image.naturalHeight
    sourceContext.drawImage(image, 0, 0)

    const imageData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
    const bounds = findInkBounds(imageData, sourceCanvas.width, sourceCanvas.height)

    if (!bounds) {
      return imageBase64
    }

    const padding = Math.round(Math.max(bounds.width, bounds.height) * 0.45)
    const sx = Math.max(0, bounds.x - padding)
    const sy = Math.max(0, bounds.y - padding)
    const sw = Math.min(sourceCanvas.width - sx, bounds.width + padding * 2)
    const sh = Math.min(sourceCanvas.height - sy, bounds.height + padding * 2)

    const scale = Math.max(2, Math.min(5, 900 / Math.max(sw, sh)))
    const outputCanvas = document.createElement('canvas')
    const outputContext = outputCanvas.getContext('2d')

    if (!outputContext) {
      return imageBase64
    }

    outputCanvas.width = Math.max(500, Math.round(sw * scale))
    outputCanvas.height = Math.max(260, Math.round(sh * scale))
    outputContext.fillStyle = '#ffffff'
    outputContext.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
    outputContext.imageSmoothingEnabled = true
    outputContext.imageSmoothingQuality = 'high'
    outputContext.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, outputCanvas.width, outputCanvas.height)

    increaseContrast(outputContext, outputCanvas.width, outputCanvas.height)
    return outputCanvas.toDataURL('image/jpeg', 0.95)
  } catch (error) {
    console.warn('Failed to preprocess image for OCR:', error)
    return imageBase64
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function findInkBounds(imageData: ImageData, width: number, height: number) {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]
      const alpha = data[index + 3]
      const brightness = (red + green + blue) / 3
      const colorSpread = Math.max(red, green, blue) - Math.min(red, green, blue)
      const isInk = alpha > 20 && brightness < 150 && colorSpread > 10

      if (isInk) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

function increaseContrast(context: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let index = 0; index < data.length; index += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const value = data[index + channel]
      data[index + channel] = value < 170 ? Math.max(0, value - 45) : Math.min(255, value + 35)
    }
  }

  context.putImageData(imageData, 0, 0)
}
