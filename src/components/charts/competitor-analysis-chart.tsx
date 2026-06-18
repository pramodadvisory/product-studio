"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

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
  { category: "Pricing", us: 85, mixpanel: 60, amplitude: 65 },
  { category: "AI Features", us: 95, mixpanel: 50, amplitude: 55 },
  { category: "Ease of Use", us: 80, mixpanel: 70, amplitude: 75 },
  { category: "Integration", us: 90, mixpanel: 85, amplitude: 80 },
  { category: "Support", us: 85, mixpanel: 75, amplitude: 80 },
  { category: "Scalability", us: 90, mixpanel: 88, amplitude: 85 },
]

const chartConfig = {
  us: {
    label: "Us",
    color: "#10b981",
  },
  mixpanel: {
    label: "Mixpanel",
    color: "#3b82f6",
  },
  amplitude: {
    label: "Amplitude",
    color: "#f59e0b",
  },
} satisfies ChartConfig

export function CompetitorAnalysisChart() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="items-center">
        <CardTitle>Competitor Analysis</CardTitle>
        <CardDescription>
          Performance comparison across key metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0 flex-1 flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" />
            <PolarGrid />
            <Radar
              name="Us"
              dataKey="us"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
            <Radar
              name="Mixpanel"
              dataKey="mixpanel"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              dot={{
                r: 3,
                fillOpacity: 0.8,
              }}
            />
            <Radar
              name="Amplitude"
              dataKey="amplitude"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.3}
              dot={{
                r: 3,
                fillOpacity: 0.8,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Leading in AI Features and Pricing <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          Competitive advantage across 6 key dimensions
        </div>
      </CardFooter>
    </Card>
  )
}
