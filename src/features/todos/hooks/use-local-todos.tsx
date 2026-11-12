import { useEffect, useState } from "react"
import type { Todo } from "../model"
import { useOnline } from "#/hooks/use-online"
import { createTodo } from "../data"

export const LOCAL_TODOS_KEY = "local-todos"

export type LocalTodo = Omit<Todo, "createdAt" | "updatedAt">

export const useLocalTodos = () => {
  const isOnline = useOnline()
  const getLocalTodos = (): LocalTodo[] => {
    const todos = localStorage.getItem(LOCAL_TODOS_KEY)
    return todos ? JSON.parse(todos) : []
  }

  const setLocalTodos = (todos: LocalTodo[]) => {
    localStorage.setItem(LOCAL_TODOS_KEY, JSON.stringify(todos))
  }

  const addLocalTodo = (todo: Omit<LocalTodo, "id">) => {
    const todos = getLocalTodos()
    const newTodo: LocalTodo = {
      id: crypto.randomUUID(),
      ...todo,
    }
    setLocalTodos([...todos, newTodo])
  }

  const removeLocalTodo = (id: string) => {
    const todos = getLocalTodos()
    const updatedTodos = todos.filter((todo) => todo.id !== id)
    setLocalTodos(updatedTodos)
  }

  const [localTodosState, setLocalTodosState] =
    useState<LocalTodo[]>(getLocalTodos())

  useEffect(() => {
    const handleStorageChange = () => {
      setLocalTodosState(getLocalTodos())
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  useEffect(() => {
    if (isOnline) {
      const petitions = async () => {
        const promises = todos.map((todo) =>
          createTodo({
            data: {
              title: todo.title,
              description: todo.description || undefined,
            },
          }),
        )

        await Promise.all(promises)
        setLocalTodos([])
      }

      const todos = getLocalTodos()
      if (todos.length > 0) {
        void petitions()
      }
    }
  }, [isOnline])

  return {
    localTodos: localTodosState,
    addLocalTodo,
    removeLocalTodo,
  }
}
