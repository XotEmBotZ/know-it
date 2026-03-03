'use client'

import { Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { GlobalTrendAnalysisDialog } from './global-trend-analysis-dialog'

export function SemanticCaseSearch() {
  return (
    <Card className="w-full border-primary/20 shadow-lg bg-slate-50/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xl">Clinical Intelligence Engine</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Analyze cross-patient clinical trends and epidemiological clusters.
              </p>
            </div>
          </div>
          <GlobalTrendAnalysisDialog />
        </div>
      </CardHeader>
    </Card>
  )
}
