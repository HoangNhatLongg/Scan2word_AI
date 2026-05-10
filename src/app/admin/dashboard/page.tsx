'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Files,
  Image,
  FileText,
  Loader2,
  TrendingUp,
  Clock,
} from 'lucide-react'

interface User {
  fullName: string
  email: string
  role: string
}

interface Stats {
  totalUsers: number
  totalImages: number
  totalExports: number
  guestImages: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Check user auth
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
      
      setUser(userData.user)

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats')
      const statsData = await statsRes.json()
      setStats(statsData.stats)
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
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
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
      <Navbar user={user} onLogout={handleLogout} />

      <main className="container py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8" />
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Tổng quan về hoạt động của hệ thống
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng người dùng
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Người dùng đã đăng ký
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng ảnh upload
                </CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalImages || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Bao gồm cả khách và thành viên
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  File đã xuất
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalExports || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  File Word/TXT đã tạo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ảnh khách (chưa đăng nhập)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.guestImages || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cần được quản lý
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý nhanh</CardTitle>
                <CardDescription>
                  Truy cập nhanh các chức năng quản trị
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start h-auto py-4">
                    <Users className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Người dùng</div>
                      <div className="text-xs text-muted-foreground">Quản lý tài khoản</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/admin/files">
                  <Button variant="outline" className="w-full justify-start h-auto py-4">
                    <Files className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Files</div>
                      <div className="text-xs text-muted-foreground">Quản lý file</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>
                  Thông tin cập nhật mới nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Hệ thống đang hoạt động</p>
                      <p className="text-xs text-muted-foreground">
                        Cập nhật: {new Date().toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Phiên bản</div>
                  <div className="text-lg font-semibold">1.0.0</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Ngày triển khai</div>
                  <div className="text-lg font-semibold">{new Date().toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Trạng thái</div>
                  <div className="text-lg font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Hoạt động
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
