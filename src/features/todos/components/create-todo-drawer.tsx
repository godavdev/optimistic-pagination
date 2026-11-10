"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { CreateTodoForm } from "@/features/todos/components/create-todo-form"
import { useIsMobile } from "@/hooks/use-mobile"

export const CreateTodoDrawer = () => {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerTrigger
        render={
          <Button
            type="button"
            size="icon-lg"
            aria-label="Create todo"
            className="fixed right-6 bottom-6 z-40 shadow-lg"
          >
            <Plus className="size-5" />
          </Button>
        }
      />
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create todo</DrawerTitle>
          <DrawerDescription>
            Enter a title and, optionally, a description.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <CreateTodoForm onCreated={() => setOpen(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
