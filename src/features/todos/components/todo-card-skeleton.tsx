import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const SkeletonLine = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn("block animate-pulse bg-muted", className)}
  />
)

type TodoCardSkeletonProps = {
  className?: string
}

export const TodoCardSkeleton = ({ className }: TodoCardSkeletonProps) => {
  return (
    <Card
      size="sm"
      aria-hidden="true"
      className={cn("w-full", className)}
    >
      <CardHeader>
        <CardTitle>
          <SkeletonLine className="h-[1lh] w-2/3" />
        </CardTitle>
        <CardAction>
          <span className="block size-7 animate-pulse bg-muted" />
        </CardAction>
        <CardDescription>
          <SkeletonLine className="h-[1lh] w-40 max-w-full" />
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="leading-relaxed">
          <SkeletonLine className="h-[1lh] w-full" />
          <SkeletonLine className="h-[1lh] w-4/5" />
        </div>
        <span className="block h-5 w-20 animate-pulse rounded-full bg-muted" />
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <span className="block h-9 w-24 animate-pulse bg-muted" />
        <span className="block h-9 w-28 animate-pulse bg-muted" />
      </CardFooter>
    </Card>
  )
}
