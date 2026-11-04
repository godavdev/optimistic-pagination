"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Archive, Check, Trash2, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { deleteTodo, updateTodo } from "@/features/todos/data"
import type { Todo, TodoStatus } from "@/features/todos/model"
import { cn } from "@/lib/utils"

const statusLabels: Record<TodoStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  archived: "Archived",
}

const statusClasses: Record<TodoStatus, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  completed: "bg-green-500/15 text-green-700 dark:text-green-400",
  archived: "bg-secondary text-secondary-foreground",
}

export const TodoCard = ({ todo }: { todo: Todo }) => {
  const queryClient = useQueryClient()

  const mutationUpdate = useMutation({
    mutationFn: async (data: {
      id: string
      status?: "pending" | "completed" | "archived" | undefined
      title?: string | undefined
      description?: string | null | undefined
    }) =>
      await updateTodo({
        data,
      }),
    onError: (error, createdTodo, onMutateResult, context) => {
      context.client.setQueryData(["todos"], onMutateResult?.previousTodos)
      console.log("Error updating todo:", error)
    },
    onMutate: async (updatedTodo, context) => {
      await context.client.cancelQueries({ queryKey: ["todos"] })
      const previousTodos: Todo[] = context.client.getQueryData(["todos"]) ?? []

      const updatedTodoIndex = previousTodos.findIndex(
        (t) => t.id === updatedTodo.id,
      )
      if (updatedTodoIndex === -1) {
        return { previousTodos }
      }

      const updatedTodoData: Todo = {
        ...previousTodos[updatedTodoIndex],
        ...updatedTodo,
        updatedAt: new Date().toISOString(),
      }

      const newTodos = [...previousTodos]
      newTodos[updatedTodoIndex] = updatedTodoData

      context.client.setQueryData(["todos"], newTodos)
      return { previousTodos }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const handleUpdate = (status: TodoStatus) => {
    mutationUpdate.mutate({ id: todo.id, status })
  }

  const handleDelete = async () => {
    await deleteTodo({ data: { id: todo.id } })
    queryClient.invalidateQueries({ queryKey: ["todos"] })
  }

  return (
    <Card
      size="sm"
      className="w-full"
    >
      <CardHeader>
        <CardTitle
          className={cn(
            todo.status === "completed" && "line-through",
            todo.status === "archived" && "text-muted-foreground",
          )}
        >
          {todo.title}
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete "${todo.title}"`}
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </CardAction>
        <CardDescription>
          {new Date(todo.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {todo.description ? (
          <p className="leading-relaxed whitespace-pre-wrap">
            {todo.description}
          </p>
        ) : null}
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase",
            statusClasses[todo.status],
          )}
        >
          {statusLabels[todo.status]}
        </span>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        {todo.status === "pending" ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdate("archived")}
            >
              <Archive />
              Archive
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleUpdate("completed")}
            >
              <Check />
              Complete
            </Button>
          </>
        ) : todo.status === "completed" ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdate("archived")}
            >
              <Archive />
              Archive
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdate("pending")}
            >
              <Undo2 />
              Reopen
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleUpdate("pending")}
          >
            <Undo2 />
            Restore
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
