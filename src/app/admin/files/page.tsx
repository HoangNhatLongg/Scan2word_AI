'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatFileSize } from '@/lib/utils'
import {
  Files,
  Search,
  Loader2,
  Download,
  Trash2,
  FileImage,
  User,
  Ghost,
  FileText,
  ExternalLink,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface User {
  fullName: string
  email: string
  role: string
}

interface ExportFile {
  id: number
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  createdAt: string
  user: {
    id: number
    fullName: string
    email: string
  } | null
  ocrResult: {
    id: number
    extractedText: string
    image: {
      fileName: string
      filePath: string
    }
  }
}

export default function AdminFilesPage() {
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [files, setFiles] = useState<ExportFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<ExportFile | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me')
      const userData = await userRes.json()
      
      if (!userData.user) {
        router.push('/login')
        return
      }
      
      if (userData.user.role !== 'admin') {
        router.push('/')
        return
      }
      
      setAdminUser(userData.user)

      const filesRes = await fetch('/api/files')
      const filesData = await filesRes.json()
      setFiles(filesData.files || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE' })
      setAdminUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const deleteFile = async (fileId: number) => {
    if (!confirm('Bạn có chắc muốn xóa file này?')) return

    try {
      const res = await fetch(`/api/files?id=${fileId}`, { method: 'DELETE' })
      if (res.ok) {
        setFiles(files.filter(f => f.id !== fileId))
        toast({
          title: 'Xóa thành công',
          description: 'File đã được xóa',
          variant: 'success',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa file',
        variant: 'destructive',
      })
    }
  }

  const filteredFiles = files.filter(file =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.ocrResult.extractedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.user?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={adminUser} onLogout={handleLogout} />

      <main className="container py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Files className="w-8 h-8" />
                Quản lý file
              </h1>
              <p className="text-muted-foreground mt-2">
                Quản lý file xuất của người dùng
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách file xuất</CardTitle>
              <CardDescription>
                Tổng cộng {filteredFiles.length} file
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Files className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Không tìm thấy file' : 'Chưa có file nào'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-muted rounded-lg">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{file.fileName}.{file.fileType}</p>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded uppercase">
                              {file.fileType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              {file.user ? (
                                <>
                                  <User className="w-3 h-3" />
                                  {file.user.fullName}
                                </>
                              ) : (
                                <>
                                  <Ghost className="w-3 h-3" />
                                  Khách
                                </>
                              )}
                            </span>
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>{formatDate(file.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedFile(file)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.filePath, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFile(file.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedFile?.fileName}.{selectedFile?.fileType}</DialogTitle>
            <DialogDescription>
              {selectedFile && formatDate(selectedFile.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 mt-4 flex-1 overflow-hidden">
            <div className="w-1/3 border rounded-lg overflow-hidden">
              <img
                src={selectedFile?.ocrResult.image.filePath}
                alt="Source"
                className="w-full h-full object-contain bg-muted"
              />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Nội dung OCR</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedFile && navigator.clipboard.writeText(selectedFile.ocrResult.extractedText)}
                >
                  Sao chép
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-muted rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {selectedFile?.ocrResult.extractedText}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between">
            <div className="text-sm text-muted-foreground">
              Người tạo: {selectedFile?.user?.fullName || 'Khách'}
              <br />
              Kích thước: {selectedFile && formatFileSize(selectedFile.fileSize)}
            </div>
            <Button
              size="sm"
              onClick={() => selectedFile && window.open(selectedFile.filePath, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Tải file
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
