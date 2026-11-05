"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useInView } from "motion/react"
import { Button } from "@/components/ui/button"
import { getTodos } from "@/features/todos/data"
import { TodoCard } from "@/features/todos/components/todo-card"
import { useEffect, useRef } from "react"
import { Loader } from "lucide-react"

export const TodosFeed = () => {
  const elementRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(elementRef, { margin: "0px 0px 200px 0px" })

  console.log("isInView", isInView)

  // const {
  //   data: todos,
  //   isPending,
  //   isError,
  //   refetch,
  //   isFetching,
  // } = useQuery({
  //   queryKey: ["todos"],
  //   queryFn: () => getTodos({ data: {  } }),
  // })

  const {
    data,
    isPending,
    isError,
    isFetching,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["todos"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getTodos({ data: { page: pageParam } }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) {
        return undefined
      }
      return allPages.length
    },
  })

  const isPetitionInProcess = useRef(false)

  useEffect(() => {
    if (isInView) {
      fetchNextPage()
    }
  }, [isInView, fetchNextPage])

  const todos = data?.pages.flat() ?? []

  console.log("todos", todos)

  return (
    // <button
    //   onClick={() => {
    //     console.log("fetchNextPage", fetchNextPage)
    //     fetchNextPage()
    //   }}
    // >
    //   Load more
    // </button>

    <section
      aria-label="Todos feed"
      className="flex w-full min-w-0 flex-col gap-4"
    >
      <header className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Todos feed</h2>
        <p className="text-sm text-muted-foreground">
          {todos
            ? `${todos.length} ${todos.length === 1 ? "todo" : "todos"}`
            : "All your todos, newest first."}
        </p>
      </header>

      {isPending ? (
        <div
          className="flex flex-col gap-4"
          aria-busy="true"
        >
          <p className="text-sm text-muted-foreground">Loading todos…</p>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-32 w-full animate-pulse bg-muted"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 border border-destructive/30 p-4">
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            Could not load the todos. Try again.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : todos.length === 0 ? (
        <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">
          No todos yet. Create one with the form.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {todos.map((todo) => (
            <li key={todo.id}>
              <TodoCard todo={todo} />
            </li>
          ))}
        </ol>
      )}
      {/* <Button onClick={() => fetchNextPage()}>Load more</Button> */}
      {!isPending && <Loader ref={elementRef} />}
    </section>
  )
}
