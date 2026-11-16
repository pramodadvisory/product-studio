"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { competitor: "Us", share: 275 },
  { competitor: "Mixpanel", share: 200 },
  { competitor: "Amplitude", share: 187 },
  { competitor: "Heap", share: 173 },
  { competitor: "Others", share: 90 },
]

const chartConfig = {
  share: {
    label: "Market Share",
    color: "#0ea5e9",
  },
  competitor: {
    label: "Competitor",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function MarketshareChart() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Market Share</CardTitle>
        <CardDescription>2024 Analytics Platform Market</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1">
        <ChartContainer
          config={chartConfig}
          className="h-full min-h-0 w-full !aspect-auto"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ right: 16 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="competitor"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="share" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar dataKey="share" fill="var(--color-share)" radius={4}>
              <LabelList
                dataKey="competitor"
                position="insideLeft"
                offset={8}
                className="fill-(--color-label)"
                fontSize={12}
              />
              <LabelList
                dataKey="share"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing market share by top competitors
        </div>
      </CardFooter>
    </Card>
  )
}
