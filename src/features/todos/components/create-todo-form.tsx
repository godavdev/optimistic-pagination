"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createTodo } from "@/features/todos/data"
import type { Todo } from "../model"

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

export const CreateTodoForm = () => {
  const queryClient = useQueryClient()

  const form = useForm<CreateTodoFormValues>({
    resolver: zodResolver(createTodoFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async ({
      title,
      description,
    }: {
      title: string
      description?: string | undefined
    }) =>
      await createTodo({
        data: {
          title,
          description: description || undefined,
        },
      }),
    onError: (error, createdTodo, onMutateResult, context) => {
      context.client.setQueryData(["todos"], onMutateResult?.previousTodos)
      console.log("Error creating todo:", error)
    },
    onSuccess: () => {
      console.log("Todo created successfully")
    },
    onMutate: async (createdTodo, context) => {
      await context.client.cancelQueries({ queryKey: ["todos"] })
      const previousTodos: Todo[] = context.client.getQueryData(["todos"]) ?? []
      const newTodo: Todo = {
        id: "temp-id" + new Date().getTime(),
        title: createdTodo.title,
        description: createdTodo.description || null,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const newTodos = [newTodo, ...(previousTodos || [])]
      context.client.setQueryData(["todos"], newTodos)
      return { previousTodos }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] })
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values)
    setTimeout(() => {
      form.reset()
    }, 0)
  })

  const isSubmitting = form.formState.isSubmitting

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Create todo</CardTitle>
        <CardDescription>
          Enter a title and, optionally, a description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id={FORM_ID}
          noValidate
          onSubmit={onSubmit}
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

            {/* {<FieldError>Could not create the todo. Try again.</FieldError>} */}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
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
            form={FORM_ID}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create todo"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
