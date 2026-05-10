'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  onFileSelect: (file: File) => void
  currentFile?: File | null
  preview?: string | null
  onClear?: () => void
}

export function ImageUpload({ onFileSelect, currentFile, preview, onClear }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  const handleClear = () => {
    if (onClear) onClear()
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          currentFile && 'hidden'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">Kéo thả ảnh vào đây</p>
            <p className="text-sm text-muted-foreground mt-1">
              hoặc nhấn để chọn file
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ: JPG, PNG (tối đa 10MB)
          </p>
        </div>
      </div>

      {currentFile && preview && (
        <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-[400px] object-contain"
          />
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs">
              {currentFile.name}
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleClear}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentFile && !preview && (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
          <FileImage className="w-8 h-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{currentFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(currentFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
