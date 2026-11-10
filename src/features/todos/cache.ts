import type { InfiniteData, QueryClient } from "@tanstack/react-query"

import type { Todo } from "./model"

export const todosQueryKey = ["todos"] as const

export type TodosInfiniteData = InfiniteData<Todo[], number>

export const createEmptyTodosData = (): TodosInfiniteData => ({
  pages: [],
  pageParams: [],
})

export const getTodosInCache = (client: QueryClient) =>
  client.getQueryData<TodosInfiniteData>(todosQueryKey)

export const setTodosInCache = (
  client: QueryClient,
  data: TodosInfiniteData | undefined,
) => {
  client.setQueryData<TodosInfiniteData>(todosQueryKey, data)
}

export const addTodoToCache = (
  data: TodosInfiniteData,
  todo: Todo,
): TodosInfiniteData => {
  const [firstPage = [], ...restPages] = data.pages

  return {
    ...data,
    pages: [[todo, ...firstPage], ...restPages],
    pageParams: data.pageParams.length === 0 ? [0] : data.pageParams,
  }
}

export const updateTodoInCache = (
  data: TodosInfiniteData,
  todoId: string,
  update: (todo: Todo) => Todo,
): TodosInfiniteData => ({
  ...data,
  pages: data.pages.map((page) =>
    page.map((todo) => (todo.id === todoId ? update(todo) : todo)),
  ),
})

export const removeTodoFromCache = (
  data: TodosInfiniteData,
  todoId: string,
): TodosInfiniteData => ({
  ...data,
  pages: data.pages.map((page) => page.filter((todo) => todo.id !== todoId)),
})
