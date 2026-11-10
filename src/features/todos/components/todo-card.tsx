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
import { toast } from "@/components/ui/toast"
import {
  getTodosInCache,
  removeTodoFromCache,
  setTodosInCache,
  todosQueryKey,
  updateTodoInCache,
} from "@/features/todos/cache"
import { deleteTodo, updateTodo } from "@/features/todos/data"
import type { Todo, TodoStatus } from "@/features/todos/model"
import { cn } from "@/lib/utils"

type UpdateTodoInput = {
  id: string
  title?: string
  description?: string | null
  status?: TodoStatus
}

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

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTodoInput) => updateTodo({ data: input }),
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey })

      const previousTodos = getTodosInCache(queryClient)
      const { id, ...fields } = updatedTodo

      if (previousTodos) {
        setTodosInCache(
          queryClient,
          updateTodoInCache(previousTodos, id, (todo) => ({
            ...todo,
            ...fields,
            updatedAt: new Date().toISOString(),
          })),
        )
      }

      return { previousTodos }
    },
    onSuccess: (savedTodo) => {
      toast.add({
        title: "Todo updated",
        description: `"${savedTodo.title}" is now ${statusLabels[savedTodo.status].toLowerCase()}.`,
        type: "success",
      })
    },
    onError: (_error, _variables, onMutateResult) => {
      setTodosInCache(queryClient, onMutateResult?.previousTodos)
      toast.add({
        title: "Could not update todo",
        description: "The change was reverted. Please try again.",
        type: "error",
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: todosQueryKey })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTodo({ data: { id } }),
    onMutate: async (todoId) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey })

      const previousTodos = getTodosInCache(queryClient)
      if (previousTodos) {
        setTodosInCache(queryClient, removeTodoFromCache(previousTodos, todoId))
      }

      return { previousTodos }
    },
    onSuccess: () => {
      toast.add({
        title: "Todo deleted",
        description: `"${todo.title}" was removed from your list.`,
        type: "success",
      })
    },
    onError: (_error, _todoId, onMutateResult) => {
      setTodosInCache(queryClient, onMutateResult?.previousTodos)
      toast.add({
        title: "Could not delete todo",
        description: "The todo was restored. Please try again.",
        type: "error",
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: todosQueryKey })
    },
  })

  const handleUpdate = (status: TodoStatus) => {
    updateMutation.mutate({ id: todo.id, status })
  }

  const handleDelete = () => {
    deleteMutation.mutate(todo.id)
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
