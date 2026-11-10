"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "motion/react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { todosQueryKey } from "@/features/todos/cache";
import { TodoCard } from "@/features/todos/components/todo-card";
import { TodoCardSkeleton } from "@/features/todos/components/todo-card-skeleton";
import { getTodos } from "@/features/todos/data";

export const TodosFeed = () => {
  const elementRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(elementRef, { margin: "0px 0px 200px 0px" });

  const {
    data,
    isPending,
    isError,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: todosQueryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getTodos({ data: { page: pageParam } }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return allPages.length;
    },
  });

  useEffect(() => {
    if (!isInView || !hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const todos = data?.pages.flat() ?? [];

  return (
    <section
      aria-label="Todos feed"
      className="flex w-full min-w-0 flex-col gap-4"
    >
      {isPending ? (
        <div
          className="flex flex-col gap-4"
          aria-busy="true"
        >
          {[0, 1, 2].map((index) => (
            <TodoCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 border border-destructive/30 p-4">
          <p role="alert" className="text-sm text-destructive">
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
      {hasNextPage && (
        <div
          ref={elementRef}
          role="status"
          aria-label="Loading more todos"
        >
          <TodoCardSkeleton />
        </div>
      )}
    </section>
  );
};
