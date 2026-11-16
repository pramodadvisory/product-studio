"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Sections Completed</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            39 / 68
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              57%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Past halfway mark <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            39 of 68 sections marked Done
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>In Progress</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            29
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDownIcon />
              43%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active sections remaining <TrendingDownIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            29 sections still in progress
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Reviewer Assigned</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            41 / 68
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              60%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Majority reviewed <TrendingUpIcon className="size-4" />
          </div>
          <div className="text-muted-foreground">
            27 sections still need a reviewer
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
