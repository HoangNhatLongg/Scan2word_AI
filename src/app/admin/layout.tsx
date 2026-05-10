'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Files,
  Image,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Người dùng',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Files',
    href: '/admin/files',
    icon: Files,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="p-1.5 bg-primary rounded-lg">
              <Files className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>Scan2Word</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-2',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.title}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Quản trị viên
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
