import { createFileRoute } from '@tanstack/react-router'

import { CreateTodoDrawer } from '#/features/todos/components/create-todo-drawer'
import { TodosFeed } from '#/features/todos/components/todos-feed'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl p-8 pb-24">
      <TodosFeed />
      <CreateTodoDrawer />
    </main>
  )
}
