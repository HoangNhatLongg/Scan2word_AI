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
  FileText,
  Search,
  Loader2,
  Image,
  FileUp,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface User {
  fullName: string
  email: string
  role: string
}

interface FileItem {
  id: number
  type: 'uploadedImage' | 'ocrResult' | 'exportFile'
  fileName?: string
  fileSize?: number
  mimeType?: string
  fileType?: string
  status: string
  createdAt: string
  user: { id: number; fullName: string; email: string } | null
  extractedText?: string
  confidence?: number
  image?: { fileName: string; filePath: string }
  ocrResult?: { id: number; extractedText: string }
  exportFiles?: { id: number; fileName: string; fileType: string }[]
}

interface Stats {
  uploadedImages: number
  ocrResults: number
  exportFiles: number
}

export default function AdminFilesPage() {
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [stats, setStats] = useState<Stats>({ uploadedImages: 0, ocrResults: 0, exportFiles: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'uploadedImages' | 'ocrResults' | 'exportFiles'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [activeTab, page])

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

      const params = new URLSearchParams({
        type: activeTab,
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) params.append('search', searchQuery)

      const filesRes = await fetch(`/api/admin/files?${params}`)
      const filesData = await filesRes.json()
      setFiles(filesData.files || [])
      setStats(filesData.stats || { uploadedImages: 0, ocrResults: 0, exportFiles: 0 })
      setTotalPages(filesData.pagination?.totalPages || 1)
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

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return 'Hoàn thành'
      case 'failed':
        return 'Thất bại'
      default:
        return 'Đang xử lý'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'uploadedImage':
        return <Image className="w-4 h-4" />
      case 'ocrResult':
        return <FileText className="w-4 h-4" />
      case 'exportFile':
        return <Download className="w-4 h-4" />
      default:
        return <FileUp className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'uploadedImage':
        return 'Ảnh upload'
      case 'ocrResult':
        return 'Kết quả OCR'
      case 'exportFile':
        return 'File xuất'
      default:
        return type
    }
  }

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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="w-8 h-8" />
                Quản lý File
              </h1>
              <p className="text-muted-foreground mt-2">
                Xem và quản lý các file đã upload, kết quả OCR và file xuất
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ảnh đã upload</CardTitle>
                <Image className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uploadedImages}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Kết quả OCR</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ocrResults}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">File đã xuất</CardTitle>
                <Download className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.exportFiles}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'uploadedImages', 'ocrResults', 'exportFiles'] as const).map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setActiveTab(tab); setPage(1); }}
                    >
                      {tab === 'all' ? 'Tất cả' : 
                       tab === 'uploadedImages' ? 'Ảnh' : 
                       tab === 'ocrResults' ? 'OCR' : 'Xuất file'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách {activeTab === 'all' ? 'file gần đây' : getTypeLabel(activeTab).toLowerCase()}</CardTitle>
              <CardDescription>
                {activeTab === 'all' ? '5 file gần nhất' : `Tổng cộng ${files.length} mục`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileUp className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có file nào'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Loại</th>
                        <th className="text-left py-3 px-4 font-medium">Tên file</th>
                        <th className="text-left py-3 px-4 font-medium">Người dùng</th>
                        <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                        <th className="text-left py-3 px-4 font-medium">Ngày tạo</th>
                        <th className="text-right py-3 px-4 font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={`${file.type}-${file.id}`} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(file.type)}
                              <span className="text-sm">{getTypeLabel(file.type)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-[200px] truncate">
                              <span className="font-medium">{file.fileName || file.image?.fileName || 'N/A'}</span>
                              {file.fileSize && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({formatFileSize(file.fileSize)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {file.user ? (
                              <div>
                                <div className="font-medium">{file.user.fullName}</div>
                                <div className="text-xs text-muted-foreground">{file.user.email}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Khách</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(file.status)}
                              <span className="text-sm">{getStatusLabel(file.status)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(file.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => { setSelectedItem(file); setShowDetailDialog(true); }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {activeTab !== 'all' && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết {selectedItem && getTypeLabel(selectedItem.type)}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-medium">{selectedItem.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại</p>
                  <p className="font-medium">{getTypeLabel(selectedItem.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className="font-medium flex items-center gap-2">
                    {getStatusIcon(selectedItem.status)}
                    {getStatusLabel(selectedItem.status)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">{formatDate(selectedItem.createdAt)}</p>
                </div>
                {selectedItem.fileName && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Tên file</p>
                    <p className="font-medium">{selectedItem.fileName}</p>
                  </div>
                )}
                {selectedItem.fileSize && (
                  <div>
                    <p className="text-sm text-muted-foreground">Kích thước</p>
                    <p className="font-medium">{formatFileSize(selectedItem.fileSize)}</p>
                  </div>
                )}
                {selectedItem.mimeType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Loại file</p>
                    <p className="font-medium">{selectedItem.mimeType}</p>
                  </div>
                )}
                {selectedItem.user && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Người dùng</p>
                    <p className="font-medium">{selectedItem.user.fullName} ({selectedItem.user.email})</p>
                  </div>
                )}
                {selectedItem.extractedText && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Nội dung OCR</p>
                    <div className="bg-muted p-3 rounded-md text-sm max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{selectedItem.extractedText}</pre>
                    </div>
                  </div>
                )}
                {selectedItem.confidence && (
                  <div>
                    <p className="text-sm text-muted-foreground">Độ chính xác</p>
                    <p className="font-medium">{(selectedItem.confidence * 100).toFixed(1)}%</p>
                  </div>
                )}
                {selectedItem.exportFiles && selectedItem.exportFiles.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">File đã xuất</p>
                    <div className="space-y-2">
                      {selectedItem.exportFiles.map(exp => (
                        <div key={exp.id} className="flex items-center gap-2 bg-muted p-2 rounded">
                          <Download className="w-4 h-4" />
                          <span className="text-sm">{exp.fileName}</span>
                          <span className="text-xs text-muted-foreground">({exp.fileType})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
