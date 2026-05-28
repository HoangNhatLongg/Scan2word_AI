import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  icons: {
    icon: '/logo.png',
  },
  title: 'Scan2Word AI - Chuyển chữ viết tay sang file Word',
  description: 'Hệ thống AI nhận diện chữ viết tay từ hình ảnh và chuyển đổi thành file Word',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="min-h-screen bg-background antialiased">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
