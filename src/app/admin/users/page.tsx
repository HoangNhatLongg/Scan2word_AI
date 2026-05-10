'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import {
  Users,
  Search,
  Loader2,
  Ban,
  CheckCircle,
  UserCog,
  MoreVertical,
  Shield,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface User {
  fullName: string
  email: string
  role: string
}

interface AdminUser {
  id: number
  fullName: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    uploadedImages: number
    ocrResults: number
    exportFiles: number
  }
}

export default function AdminUsersPage() {
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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

      const usersRes = await fetch('/api/admin/users')
      const usersData = await usersRes.json()
      setUsers(usersData.users || [])
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

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        ))
        toast({
          title: 'Cập nhật thành công',
          description: currentStatus ? 'Tài khoản đã bị khóa' : 'Tài khoản đã được mở khóa',
          variant: 'success',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật tài khoản',
        variant: 'destructive',
      })
    }
  }

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ))
        toast({
          title: 'Cập nhật thành công',
          description: `Vai trò đã được thay đổi thành ${newRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}`,
          variant: 'success',
        })
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật vai trò',
        variant: 'destructive',
      })
    }
  }

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                <Users className="w-8 h-8" />
                Quản lý người dùng
              </h1>
              <p className="text-muted-foreground mt-2">
                Quản lý tài khoản và phân quyền người dùng
              </p>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>
                Tổng cộng {filteredUsers.length} người dùng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Người dùng</th>
                        <th className="text-left py-3 px-4 font-medium">Vai trò</th>
                        <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                        <th className="text-left py-3 px-4 font-medium">Hoạt động</th>
                        <th className="text-left py-3 px-4 font-medium">Ngày tạo</th>
                        <th className="text-right py-3 px-4 font-medium">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' && <Shield className="w-3 h-3" />}
                              {user.role === 'admin' ? 'Admin' : 'Người dùng'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <Ban className="w-3 h-3" />
                              )}
                              {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {user._count.uploadedImages} ảnh • {user._count.exportFiles} file
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.isActive)}>
                                  {user.isActive ? (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" />
                                      Khóa tài khoản
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Mở khóa
                                    </>
                                  )}
                                </DropdownMenuItem>
                                {user.role !== 'admin' && (
                                  <DropdownMenuItem onClick={() => updateUserRole(user.id, 'admin')}>
                                    <UserCog className="w-4 h-4 mr-2" />
                                    Đặt làm Admin
                                  </DropdownMenuItem>
                                )}
                                {user.role === 'admin' && user.id !== adminUser?.id && (
                                  <DropdownMenuItem onClick={() => updateUserRole(user.id, 'user')}>
                                    <Users className="w-4 h-4 mr-2" />
                                    Đặt làm User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
