"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

export function SuccessProbabilityCard() {
  const factors = [
    {
      label: "Competitive Advantage",
      value: 90,
      change: "+20%",
      changeColor: "text-green-600",
      tooltip: "AI-powered insights at 40% lower cost vs competitors like Mixpanel and Amplitude"
    },
    {
      label: "Market Timing",
      value: 85,
      change: "+18%",
      changeColor: "text-green-600",
      tooltip: "Growing demand for AI-powered analytics with 12% CAGR expansion in $8.5B TAM"
    },
    {
      label: "Team Strength",
      value: 95,
      change: "+22%",
      changeColor: "text-green-600",
      tooltip: "Strong execution capability and deep expertise in product analytics and AI"
    },
    {
      label: "Market Competition",
      value: 70,
      change: "-15%",
      changeColor: "text-orange-600",
      tooltip: "Established competitors with large customer bases and strong brand recognition"
    },
    {
      label: "Execution Risk",
      value: 60,
      change: "-10%",
      changeColor: "text-orange-600",
      tooltip: "Complexity in AI model development and integrations with existing platforms"
    }
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Success Probability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
          <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Overall Probability</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">78%</p>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-4">
          <TooltipProvider>
            {factors.map((factor) => (
              <Tooltip key={factor.label}>
                <TooltipTrigger className="w-full text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{factor.label}</span>
                    <span className={`text-xs font-semibold ${factor.changeColor}`}>{factor.change}</span>
                  </div>
                  <Progress value={factor.value}>
                    <ProgressTrack>
                      <ProgressIndicator />
                    </ProgressTrack>
                  </Progress>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {factor.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
