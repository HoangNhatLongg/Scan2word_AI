'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, Copy, Check, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import dynamic from 'next/dynamic'
import { marked } from 'marked'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center text-muted-foreground">Đang tải trình soạn thảo...</div> })
import 'react-quill/dist/quill.snow.css'

interface TextEditorProps {
  text: string
  onChange: (text: string) => void
  onExportDocx: (fileName: string) => void
  onExportTxt: (fileName: string) => void
  isExporting?: boolean
  originalFileName?: string
  ocrResultId?: number
}

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['clean'],
  ],
}

export function TextEditor({
  text,
  onChange,
  onExportDocx,
  onExportTxt,
  isExporting,
  originalFileName,
  ocrResultId,
}: TextEditorProps) {
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState(
    originalFileName?.replace(/\.[^/.]+$/, '') || 'document'
  )
  const { toast } = useToast()
  
  // State to hold the HTML content for the editor
  const [editorHtml, setEditorHtml] = useState('')
  const currentDelta = useRef<any>(null)
  const plainTextRef = useRef<string>('')

  // Convert incoming text (markdown) to HTML on first load or when OCR finishes
  useEffect(() => {
    if (text && !text.startsWith('<')) {
      const parsedHtml = marked.parse(text) as string
      setEditorHtml(parsedHtml)
      onChange(parsedHtml) // Sync parent state with the HTML representation
    } else if (text !== editorHtml) {
      setEditorHtml(text)
    }
  }, [text])

  const handleEditorChange = (content: string, delta: any, source: string, editor: any) => {
    setEditorHtml(content)
    currentDelta.current = editor.getContents()
    plainTextRef.current = editor.getText()
    onChange(content)
  }

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(plainTextRef.current || text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  const downloadTextFile = async (filename: string) => {
    const textContent = plainTextRef.current || text.replace(/<[^>]+>/g, '')
    
    if (ocrResultId) {
      try {
        await fetch('/api/files/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textContent,
            fileName: filename,
            fileType: 'txt',
            ocrResultId,
          }),
        })
      } catch (e) {
        console.error('Failed to save export record:', e)
      }
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Xuất file thành công',
      description: `${filename}.txt đã được tải xuống`,
      variant: 'success',
    })
    
    if (fileName.trim()) onExportTxt(fileName.trim())
  }

  const downloadDocxFile = async (filename: string) => {
    try {
      if (ocrResultId) {
        try {
          await fetch('/api/files/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: plainTextRef.current || text,
              fileName: filename,
              fileType: 'docx',
              ocrResultId,
            }),
          })
        } catch (e) {
          console.error('Failed to save export record:', e)
        }
      }

      // Generate DOCX blob from Quill Delta
      let blob: Blob;
      if (currentDelta.current) {
        const quillToWord = await import('quill-to-word')
        const docxBuffer = await quillToWord.generateWord(currentDelta.current, {
          exportAs: 'buffer'
        })
        blob = new Blob([docxBuffer as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      } else {
        // Fallback for empty/uninitialized delta
        blob = new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Xuất file thành công',
        description: `${filename}.docx đã được tải xuống`,
        variant: 'success',
      })
      
      if (fileName.trim()) onExportDocx(fileName.trim())
    } catch (error) {
      console.error('Lỗi khi xuất DOCX:', error)
      toast({
        title: 'Lỗi xuất file',
        description: 'Không thể tạo file Word. Vui lòng thử lại.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-background">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="flex-1 max-w-[300px] px-3 py-1.5 text-sm font-medium bg-background rounded-md border focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Tên file"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Đã sao chép
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Sao chép
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 m-0 h-full min-h-[500px]">
        <style>{`
          .quill {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .ql-container {
            flex: 1;
            overflow-y: auto;
            font-size: 16px;
            font-family: inherit;
          }
          .ql-editor {
            min-height: 400px;
          }
          .ql-toolbar {
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
            background-color: var(--muted);
          }
        `}</style>
        <ReactQuill 
          theme="snow"
          value={editorHtml}
          onChange={handleEditorChange}
          modules={QUILL_MODULES}
          className="h-full"
          placeholder="Nội dung nhận diện sẽ hiển thị ở đây. Bạn có thể chỉnh sửa như trong Word..."
        />
      </div>

      <div className="flex items-center justify-between p-4 border-t bg-muted/30">
        <p className="text-sm text-muted-foreground">
          {plainTextRef.current?.length || 0} ký tự
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => downloadTextFile(fileName)}
            disabled={!text}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Xuất TXT
          </Button>
          <Button
            onClick={() => downloadDocxFile(fileName)}
            disabled={!text || isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <File className="w-4 h-4" />
                Xuất Word
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
