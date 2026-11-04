import { createServerFn } from '@tanstack/react-start'

import { prisma } from '../../db'
import { todoSchema } from './model'

const MUTATION_DELAY_MS = 10_000

const delay = (ms = MUTATION_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const todoIdSchema = todoSchema.pick({ id: true })

const createTodoSchema = todoSchema
  .pick({ title: true, description: true })
  .partial({ description: true })

const updateTodoSchema = todoSchema
  .pick({ id: true, title: true, description: true, status: true })
  .partial({ title: true, description: true, status: true })

export const getTodos = createServerFn({ method: 'GET' }).handler(async () => {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' } })
  return todos.map((todo) => ({
    ...todo,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  }))
})

export const getTodoById = createServerFn({ method: 'GET' })
  .validator(todoIdSchema)
  .handler(async ({ data }) => {
    const todo = await prisma.todo.findUniqueOrThrow({ where: { id: data.id } })
    return {
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
    }
  })

export const createTodo = createServerFn({ method: 'POST' })
  .validator(createTodoSchema)
  .handler(async ({ data }) => {
    await delay()
    const todo = await prisma.todo.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: 'pending',
      },
    })
    return {
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
    }
  })

export const updateTodo = createServerFn({ method: 'POST' })
  .validator(updateTodoSchema)
  .handler(async ({ data }) => {
    await delay()
    const { id, ...fields } = data
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        ...(fields.title !== undefined ? { title: fields.title } : {}),
        ...(fields.description !== undefined
          ? { description: fields.description }
          : {}),
        ...(fields.status !== undefined ? { status: fields.status } : {}),
      },
    })
    return {
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
    }
  })

export const deleteTodo = createServerFn({ method: 'POST' })
  .validator(todoIdSchema)
  .handler(async ({ data }) => {
    await delay()
    await prisma.todo.delete({ where: { id: data.id } })
    return { id: data.id }
  })
