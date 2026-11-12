"use client"

import { TodoCard } from "@/features/todos/components/todo-card"
import { useLocalTodos } from "../hooks/use-local-todos"

export const LocalTodosFeed = () => {
  const { localTodos } = useLocalTodos()

  return (
    <section
      aria-label="Todos feed"
      className="flex w-full min-w-0 flex-col gap-4"
    >
      {localTodos.length === 0 ? (
        <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">
          No local todos yet. Create one with the form.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {localTodos.map((todo) => (
            <li key={todo.id}>
              <TodoCard
                todo={{
                  ...todo,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
