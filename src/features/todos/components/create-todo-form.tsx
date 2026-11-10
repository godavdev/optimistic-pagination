"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  addTodoToCache,
  createEmptyTodosData,
  getTodosInCache,
  setTodosInCache,
  todosQueryKey,
  updateTodoInCache,
} from "@/features/todos/cache"
import { createTodo } from "@/features/todos/data"
import type { Todo } from "@/features/todos/model"

const FORM_ID = "form-create-todo"

const createTodoFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: "Title is required." })
    .max(200, { error: "Title must be at most 200 characters." }),
  description: z
    .string()
    .trim()
    .max(2000, { error: "Description must be at most 2000 characters." })
    .optional(),
})

type CreateTodoFormValues = z.infer<typeof createTodoFormSchema>

type CreateTodoFormProps = {
  onCreated?: () => void
}

export const CreateTodoForm = ({ onCreated }: CreateTodoFormProps) => {
  const queryClient = useQueryClient()

  const form = useForm<CreateTodoFormValues>({
    resolver: zodResolver(createTodoFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (variables: CreateTodoFormValues) =>
      await createTodo({
        data: {
          title: variables.title,
          description: variables.description || undefined,
        },
      }),
    onMutate: async (createdTodo) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey })

      const previousTodos = getTodosInCache(queryClient)
      const now = new Date().toISOString()
      const optimisticTodo: Todo = {
        id: `temp-${crypto.randomUUID()}`,
        title: createdTodo.title,
        description: createdTodo.description || null,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      }

      setTodosInCache(
        queryClient,
        addTodoToCache(previousTodos ?? createEmptyTodosData(), optimisticTodo),
      )

      return { previousTodos, optimisticTodoId: optimisticTodo.id }
    },
    onSuccess: (savedTodo, _variables, onMutateResult) => {
      toast.add({
        title: "Todo created",
        description: `"${savedTodo.title}" was added to your list.`,
        type: "success",
      })
      onCreated?.()

      if (!onMutateResult) {
        return
      }

      const currentTodos = getTodosInCache(queryClient)
      if (!currentTodos) {
        return
      }

      setTodosInCache(
        queryClient,
        updateTodoInCache(
          currentTodos,
          onMutateResult.optimisticTodoId,
          () => savedTodo,
        ),
      )
    },
    onError: (_error, _variables, onMutateResult) => {
      setTodosInCache(queryClient, onMutateResult?.previousTodos)
      toast.add({
        title: "Could not create todo",
        description: "The todo was not created. Please try again.",
        type: "error",
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: todosQueryKey })
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values)
    form.reset()
  })

  const isSubmitting = mutation.isPending

  return (
    <form
      id={FORM_ID}
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${FORM_ID}-${field.name}`}>
                Title
              </FieldLabel>
              <Input
                {...field}
                id={`${FORM_ID}-${field.name}`}
                aria-invalid={fieldState.invalid}
                placeholder="E.g.: Review optimistic pagination"
                autoComplete="off"
                disabled={isSubmitting}
              />
              <FieldDescription>Max 200 characters.</FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${FORM_ID}-${field.name}`}>
                Description
              </FieldLabel>
              <Textarea
                {...field}
                id={`${FORM_ID}-${field.name}`}
                aria-invalid={fieldState.invalid}
                placeholder="Optional todo details…"
                rows={4}
                className="min-h-24 resize-none"
                disabled={isSubmitting}
              />
              <FieldDescription>
                Optional. Max 2000 characters.
              </FieldDescription>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </FieldGroup>

      <Field orientation="horizontal" className="justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => form.reset()}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating…" : "Create todo"}
        </Button>
      </Field>
    </form>
  )
}
