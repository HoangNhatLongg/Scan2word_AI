import { z } from 'zod'

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

export const uploadSchema = z.object({
  sessionId: z.string().optional(),
})

export const ocrSchema = z.object({
  imageData: z.string(),
  language: z.enum(['vie', 'eng', 'both']).default('vie'),
})

export const exportSchema = z.object({
  text: z.string().min(1, 'Nội dung không được để trống'),
  fileName: z.string().min(1, 'Tên file không được để trống'),
  fileType: z.enum(['docx', 'txt']),
  ocrResultId: z.number().optional(),
  sessionId: z.string().optional(),
})

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['user', 'admin']).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OcrInput = z.infer<typeof ocrSchema>
export type ExportInput = z.infer<typeof exportSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
