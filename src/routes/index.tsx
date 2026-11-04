import { createFileRoute } from '@tanstack/react-router'

import { CreateTodoForm } from '#/features/todos/components/create-todo-form'
import { TodosFeed } from '#/features/todos/components/todos-feed'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto grid w-full max-w-6xl items-start gap-6 p-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-8">
        <CreateTodoForm />
      </div>
      <TodosFeed />
    </main>
  )
}
