'use client'

'use client'

import { useState, useEffect } from 'react'
import { Search, Database, UserX, Activity, Calendar, Sparkles, Loader2, FileText, Clipboard, Pill, History } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { globalCaseSearchAction } from '@/app/actions/clinical-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { GlobalTrendAnalysisDialog } from './global-trend-analysis-dialog'

export function SemanticCaseSearch() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'symptoms' | 'diagnosis'>('symptoms')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Live Debounced Search
  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setResults([])
      return
    }

    const timer = setTimeout(() => {
      handleSearch()
    }, 600) // 600ms debounce

    return () => clearTimeout(timer)
  }, [query, searchType])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await globalCaseSearchAction(query, searchType)
      if (res.success) {
        setResults(res.results || [])
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!mounted) return ''
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch (e) {
      return dateStr
    }
  }

  return (
    <Card className="w-full border-primary/20 shadow-lg bg-slate-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <CardTitle className="text-xl">Semantic Case Matching Engine</CardTitle>
          </div>
          <GlobalTrendAnalysisDialog />
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time clinical discovery across all anonymized cases.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="w-full md:w-48">
            <Select 
              value={searchType} 
              onValueChange={(v: any) => setSearchType(v)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="symptoms">By Symptoms</SelectItem>
                <SelectItem value="diagnosis">By Diagnosis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 relative">
            <Input
              placeholder={searchType === 'symptoms' 
                ? "Start typing symptoms (e.g., 'ear drum')..." 
                : "Start typing diagnosis/treatments..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white pr-10 h-11"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className="text-sm font-semibold flex items-center gap-2 px-1 mb-4 text-slate-600 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              Found {results.length} Matching Clinical Cases
            </h3>
            
            <Accordion className="space-y-4">
              {results.map((item, idx) => (
                <AccordionItem 
                  key={item.case_id || idx} 
                  value={`item-${idx}`}
                  className="bg-white border rounded-xl px-4 py-1 shadow-sm hover:border-primary/40 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-1 items-center justify-between text-left pr-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500">
                          <UserX className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                            Case Record #{item.case_id.slice(0, 8)}
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {item.matched_symptoms.length > 70 
                              ? item.matched_symptoms.slice(0, 70) + '...' 
                              : item.matched_symptoms}
                          </span>
                        </div>
                      </div>
                      
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                          {Math.round(item.similarity * 100)}% Pattern Match
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.occurrence_date)}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="pt-4 pb-6 border-t mt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 1. The Matched Record */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-full">
                          <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase">
                            <FileText className="w-3 h-3 text-primary" /> Initial Findings
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Symptoms</p>
                              <p className="text-sm text-slate-700">{item.matched_symptoms}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Plan/Solutions</p>
                              <p className="text-sm text-slate-800 font-medium italic">{item.matched_solutions || "None recorded."}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Full Patient History (Anonymized) */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50 h-full">
                          <h4 className="text-xs font-bold text-blue-600/70 mb-3 flex items-center gap-2 uppercase">
                            <History className="w-3 h-3" /> Patient Case History
                          </h4>
                          
                          {item.patient_clinical_history && item.patient_clinical_history.length > 0 ? (
                            <div className="space-y-3">
                              {item.patient_clinical_history.map((h: any, hIdx: number) => (
                                <div key={hIdx} className="bg-white/80 p-2.5 rounded-lg border border-blue-100 shadow-sm">
                                  <span className="text-[10px] font-bold text-blue-400 block mb-1">{formatDate(h.date)}</span>
                                  <p className="text-xs text-slate-600 line-clamp-2"><span className="font-semibold">Sym:</span> {h.symptoms}</p>
                                  <p className="text-xs text-slate-500 italic line-clamp-1"><span className="font-semibold text-slate-600">Sol:</span> {h.solutions}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic text-center py-4">
                              No prior visits recorded.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 3. Test Results (Anonymized) */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-purple-50/30 p-4 rounded-xl border border-purple-100/50 h-full">
                          <h4 className="text-xs font-bold text-purple-600/70 mb-3 flex items-center gap-2 uppercase">
                            <Clipboard className="w-3 h-3" /> Related Test Findings
                          </h4>
                          
                          {item.related_tests && item.related_tests.length > 0 ? (
                            <div className="space-y-3">
                              {item.related_tests.map((test: any, tIdx: number) => (
                                <div key={tIdx} className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-700">{test.test_name}</span>
                                    <span className="text-[10px] text-slate-400">{formatDate(test.date)}</span>
                                  </div>
                                  <p className="text-xs text-slate-600 italic">Result: {test.results}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic text-center py-4">
                              No laboratory data available.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

