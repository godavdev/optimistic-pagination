import { z } from 'zod'

export const todoStatusSchema = z.enum(['pending', 'completed', 'archived'])

export type TodoStatus = z.infer<typeof todoStatusSchema>

export const todoSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable(),
  status: todoStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Todo = z.infer<typeof todoSchema>
