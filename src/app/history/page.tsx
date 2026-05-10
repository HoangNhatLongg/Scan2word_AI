'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatFileSize } from '@/lib/utils'
import { FileText, Download, Search, History, Loader2, FileImage, Eye } from 'lucide-react'
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

interface HistoryItem {
  id: number
  extractedText: string
  createdAt: string
  image: {
    id: number
    fileName: string
    filePath: string
    fileSize: number
  }
  exportFiles: {
    id: number
    fileName: string
    filePath: string
    fileType: string
  }[]
}

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    }
  }

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/files/history')
      const data = await res.json()
      setHistory(data.results || [])
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải lịch sử',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/me', { method: 'DELETE' })
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const filteredHistory = history.filter(item =>
    item.extractedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.image.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast({
      title: 'Đã sao chép',
      description: 'Nội dung đã được sao chép vào clipboard',
      variant: 'success',
    })
  }

  const downloadFile = async (filePath: string, fileName: string) => {
    window.open(filePath, '_blank')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <History className="w-8 h-8" />
                Lịch sử chuyển đổi
              </h1>
              <p className="text-muted-foreground mt-2">
                Xem lại các file đã chuyển đổi trước đó
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo nội dung hoặc tên file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có lịch sử chuyển đổi'}
                </p>
                {!searchQuery && (
                  <Button
                    className="mt-4"
                    onClick={() => router.push('/')}
                  >
                    Bắt đầu chuyển đổi
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <Card key={item.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <FileImage className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.image.fileName}</CardTitle>
                          <CardDescription>
                            {formatDate(item.createdAt)} • {formatFileSize(item.image.fileSize)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.extractedText.substring(0, 200)}
                      {item.extractedText.length > 200 && '...'}
                    </p>
                    
                    {item.exportFiles.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.exportFiles.map((file) => (
                          <Button
                            key={file.id}
                            size="sm"
                            variant="secondary"
                            onClick={() => downloadFile(file.filePath, file.fileName)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {file.fileName}.{file.fileType}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedItem?.image.fileName}</DialogTitle>
            <DialogDescription>
              {selectedItem && formatDate(selectedItem.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 mt-4 flex-1 overflow-hidden">
            <div className="w-1/3 border rounded-lg overflow-hidden">
              <img
                src={selectedItem?.image.filePath}
                alt={selectedItem?.image.fileName}
                className="w-full h-full object-contain bg-muted"
              />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Nội dung OCR</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedItem && copyToClipboard(selectedItem.extractedText)}
                >
                  Sao chép
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-muted rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {selectedItem?.extractedText}
                </pre>
              </div>
            </div>
          </div>

          {selectedItem?.exportFiles && selectedItem.exportFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-sm font-medium mb-2 block">File đã xuất:</span>
              <div className="flex flex-wrap gap-2">
                {selectedItem.exportFiles.map((file) => (
                  <Button
                    key={file.id}
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadFile(file.filePath, file.fileName)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {file.fileName}.{file.fileType}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
