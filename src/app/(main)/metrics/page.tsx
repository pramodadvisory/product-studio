"use client"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { useHeaderTitle } from "@/components/header-title-context"

import data from "../docs/data.json"

export default function MetricsPage() {
  useHeaderTitle("Metrics")

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="mx-auto w-full max-w-4xl flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}
