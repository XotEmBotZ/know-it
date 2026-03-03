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
import { CalendarIcon, Activity, Sparkles, Loader2, FileText, AlertCircle } from 'lucide-react'
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
      <DialogContent className="sm:max-w-[900px] w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
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

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-5 gap-6 bg-slate-50/50 border-y shrink-0">
          <div className="md:col-span-3 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Target Symptoms</Label>
              <Input 
                placeholder="e.g. fever, headache, ear pain" 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="bg-white h-11"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Start Date</Label>
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white h-11 overflow-hidden",
                        !startDate && "text-muted-foreground"
                      )}
                    />
                  }>
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </span>
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
                        "w-full justify-start text-left font-normal bg-white h-11 overflow-hidden",
                        !endDate && "text-muted-foreground"
                      )}
                    />
                  }>
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </span>
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
              className="w-full h-11 text-base font-semibold" 
              onClick={handleAnalyze} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Synthesizing Global Insights...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Run Epidemiological Logic
                </>
              )}
            </Button>
          </div>

          <div className="md:col-span-2 bg-blue-50/50 rounded-xl p-5 border border-blue-100 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-white p-3 rounded-full shadow-md border border-blue-100">
              <AlertCircle className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Privacy & Security Notice</h4>
              <p className="text-[11px] text-blue-700/80 leading-relaxed font-medium">
                This tool performs cross-doctor analysis. All data is strictly anonymized. No personally identifiable information (PII) is exposed to the AI models.
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-600 uppercase text-[9px] tracking-widest px-3 py-1 font-bold">
              Backend Orchestrated
            </Badge>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full">
            <div className="p-6">
              {report ? (
                <div className="prose prose-sm max-w-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2 mb-6 border-b pb-4">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800 m-0">Epidemiological Report</h3>
                    <Badge className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-100">
                      Verified by Gemma 27B
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <ReactMarkdown 
                      components={{
                        table: ({node, ...props}) => <table className="border-collapse border border-slate-200 w-full mb-4" {...props} />,
                        th: ({node, ...props}) => <th className="border border-slate-200 bg-slate-50 p-2 text-left font-bold" {...props} />,
                        td: ({node, ...props}) => <td className="border border-slate-200 p-2" {...props} />,
                      }}
                    >
                      {report}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 space-y-4 py-12">
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
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t shrink-0">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setOpen(false)}>Close Analysis</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
