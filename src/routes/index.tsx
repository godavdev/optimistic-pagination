import { createFileRoute } from "@tanstack/react-router"

import { CreateTodoDrawer } from "#/features/todos/components/create-todo-drawer"
import { TodosFeed } from "#/features/todos/components/todos-feed"
import { useOnline } from "#/hooks/use-online"
import { LocalTodosFeed } from "#/features/todos/components/offline-todos-feed"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const isOnline = useOnline()

  return (
    <main className="mx-auto w-full max-w-3xl p-8 pb-24">
      {!isOnline && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-sm text-red-700">
          You are currently offline. Some features may not be available.
        </div>
      )}
      {isOnline ? <TodosFeed /> : <LocalTodosFeed />}
      <CreateTodoDrawer />
    </main>
  )
}
