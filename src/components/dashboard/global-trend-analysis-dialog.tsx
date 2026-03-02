'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Activity, Sparkles, Loader2, FileText, Share2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { analyzeGlobalSymptomTrendsAction } from '@/app/actions/clinical-actions'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export function GlobalTrendAnalysisDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [symptoms, setSymptoms] = useState('')
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 days ago
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [report, setReport] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter symptoms to analyze.')
      return
    }

    setLoading(true)
    setReport(null)
    try {
      const res = await analyzeGlobalSymptomTrendsAction(
        symptoms,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      )

      if (res.success) {
        setReport(res.report || null)
        toast.success('Epidemiological analysis complete.')
      } else {
        toast.error(res.error || 'Failed to analyze trends.')
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="border-primary/40 hover:bg-primary/5 text-primary gap-2" />}>
        <Activity className="w-4 h-4" />
        Analyze Global Trends
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Epidemiological Analysis Engine</DialogTitle>
          </div>
          <DialogDescription>
            Anonymized cross-patient reasoning using Gemma 3 27B.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 border-y">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Target Symptoms</Label>
              <Input 
                placeholder="e.g. fever, headache, ear pain" 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="bg-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Start Date</Label>
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white",
                        !startDate && "text-muted-foreground"
                      )}
                    />
                  }>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">End Date</Label>
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white",
                        !endDate && "text-muted-foreground"
                      )}
                    />
                  }>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button 
              className="w-full h-11" 
              onClick={handleAnalyze} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Comprehensive Report...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run Epidemiological Logic
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center text-center space-y-3">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <AlertCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-blue-900">Privacy & Security Notice</h4>
              <p className="text-[11px] text-blue-700 leading-relaxed max-w-[240px]">
                This tool performs cross-doctor/cross-patient analysis. All data is anonymized before processing. No personally identifiable information (PII) is exposed to the AI model.
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase text-[9px] tracking-wider">
              Backend Orchestrated
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6 min-h-[300px]">
          {report ? (
            <div className="prose prose-sm max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 mb-6 border-b pb-4">
                <FileText className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800 m-0">Epidemiological Report</h3>
                <Badge className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-100">
                  Verified by Gemma 27B
                </Badge>
              </div>
              <ReactMarkdown 
                components={{
                  table: ({node, ...props}) => <table className="border-collapse border border-slate-200 w-full" {...props} />,
                  th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 p-2 text-left" {...props} />,
                  td: ({node, ...props}) => <td className="border border-slate-200 p-2" {...props} />,
                }}
              >
                {report}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
              {!loading && (
                <>
                  <div className="p-4 bg-slate-50 rounded-full">
                    <Activity className="w-12 h-12 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No Report Generated</p>
                    <p className="text-xs">Configure the parameters and run the analysis to see clinical trends.</p>
                  </div>
                </>
              )}
              {loading && (
                <div className="space-y-4 w-full max-w-md">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4 mx-auto" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6 mx-auto" />
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3 mx-auto" />
                  <p className="text-center text-xs text-slate-500 pt-4 font-mono">Synthesizing cluster data...</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 bg-slate-50 border-t">
          <Button variant="ghost" onClick={() => setOpen(false)}>Close Analysis</Button>
          {report && (
            <Button variant="outline" className="gap-2" onClick={() => toast.info('Export coming soon!')}>
              <Share2 className="w-4 h-4" />
              Export Insights
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
