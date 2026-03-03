'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DataAccessLayer } from '@/lib/dal'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft, User, FileText, Clipboard, MessageSquare, Loader2, Bot, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AddMedicalRecordDialog } from '@/components/dashboard/add-medical-record-dialog'
import { EditMedicalRecordDialog } from '@/components/dashboard/edit-medical-record-dialog'
import { AddTestResultDialog } from '@/components/dashboard/add-test-result-dialog'
import { ReferSpecialistDialog } from '@/components/dashboard/refer-specialist-dialog'
import { ChatUI, Message } from '@/components/dashboard/chat-ui'
import { cn } from '@/lib/utils'
import { 
  createReferral, 
  addMedicalRecord, 
  addTestResult 
} from '@/app/dashboard/actions'
import { removePrescriptionImageAction } from '@/app/actions/clinical-actions'
import { chatAction } from '@/app/actions/chat-actions'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function PatientHistoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const [patientId, setPatientId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [data, setData] = useState<{
    patientProfile: any
    history: any[]
    testResults: any[]
    referrals: any[]
    user: any
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [fullHistoryEnabled, setFullHistoryEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Extract data early for use in effects/handlers
  const patientProfile = data?.patientProfile
  const history = data?.history || []
  const testResults = data?.testResults || []
  const referrals = data?.referrals || []
  const user = data?.user

  const formatDate = (dateStr: string) => {
    if (!mounted) return ''
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch (e) {
      return dateStr
    }
  }

  const refreshData = async () => {
    if (!patientId || !data?.user?.id) return
    const supabase = createClient()
    const dal = new DataAccessLayer(supabase)
    try {
      const [hist, tests, refs] = await Promise.all([
        dal.getPatientHistory(patientId),
        dal.getPatientTests(patientId),
        dal.getReferralForDoctorAndPatient(data.user.id, patientId)
      ])
      setData(prev => prev ? { ...prev, history: hist, testResults: tests, referrals: refs } : null)
    } catch (err) {
      console.error('Failed to refresh data:', err)
    }
  }

  const handleSendMessage = async (query: string) => {
    if (!patientId || !patientProfile) return 'Error: Patient not loaded'
    
    // Check if it's a treatment analysis request
    const role = query === 'Analyze Treatment Progress' ? 'analyser' : 'doctor'
    
    const res = await chatAction(patientId, patientProfile.full_name, query, messages, role, fullHistoryEnabled)
    setMessages(prev => [...prev, { role: 'user', content: query }, { role: 'assistant', content: res }])
    return res
  }

  useEffect(() => {
    if (patientProfile) {
      setMessages([
        { 
          role: 'system', 
          content: `You are a medical case analyzer for a doctor. You are currently viewing records for ${patientProfile.full_name}.` 
        },
        { 
          role: 'assistant', 
          content: `Hello Doctor. I've compiled the patient's history. How can I assist you with the analysis?` 
        }
      ])
    }
  }, [patientProfile?.id])

  const handleReferral = async (referralData: any) => {
    const res = await createReferral(referralData)
    if (res.success) {
      toast.success('Referral sent successfully')
      await refreshData()
    } else {
      toast.error(res.error || 'Failed to send referral')
    }
  }

  const handleAddRecord = async (recordData: any) => {
    const res = await addMedicalRecord(recordData)
    if (res.success) {
      toast.success('Medical record added')
      await refreshData()
    } else {
      toast.error(res.error || 'Failed to add record')
    }
  }

  const handleAddTest = async (testData: any) => {
    const res = await addTestResult(testData)
    if (res.success) {
      toast.success('Test result added')
      await refreshData()
    } else {
      toast.error(res.error || 'Failed to add test result')
    }
  }

  const handleRemoveImage = async (recordId: string) => {
    if (!patientId) return
    const res = await removePrescriptionImageAction(recordId, patientId)
    if (res.success) {
      toast.success(res.deleted ? 'Record deleted (no other content)' : 'Image removed')
      await refreshData()
    } else {
      toast.error('Failed to remove image: ' + res.error)
    }
  }

  useEffect(() => {
    async function init() {
      const { id } = await paramsPromise
      setPatientId(id)
      
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      const dal = new DataAccessLayer(supabase)
      try {
        const [profile, hist, tests, refs] = await Promise.all([
          dal.getProfile(id),
          dal.getPatientHistory(id),
          dal.getPatientTests(id),
          dal.getReferralForDoctorAndPatient(currentUser.id, id)
        ])
        setData({
          patientProfile: profile,
          history: hist as any[],
          testResults: tests,
          referrals: refs,
          user: currentUser
        })
      } catch (err) {
        console.error('Initialization failed:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [paramsPromise])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!patientProfile) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground">We couldn't load this patient's profile. You may not have permission.</p>
        <Link href="/dashboard">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full flex flex-row h-screen overflow-hidden relative">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-8 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">History</h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="md:hidden"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <div className="hidden sm:flex gap-2">
                <ReferSpecialistDialog
                  patientId={patientId!}
                  fromDoctorId={user.id}
                  onSubmit={handleReferral}
                />
                <AddTestResultDialog
                  patientId={patientId!}
                  onSubmit={handleAddTest}
                />
                <AddMedicalRecordDialog 
                  patientId={patientId!} 
                  doctorId={user.id} 
                  onSubmit={handleAddRecord} 
                />
              </div>
            </div>
          </div>

          {referrals && referrals.length > 0 && (
            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-700 flex items-center gap-2 text-base md:text-lg">
                  <Clipboard className="w-5 h-5" />
                  Incoming Referral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-emerald-900/80">
                  Referral from <span className="font-bold">{referrals[0].from_doctor?.full_name}</span> on {formatDate(referrals[0].created_at)}
                </p>
                <div className="p-3 bg-white/50 rounded border border-emerald-100 text-sm">
                  <p className="font-semibold text-emerald-900">Reason: {referrals[0].reason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl md:text-2xl">{patientProfile.full_name}</CardTitle>
                    <p className="text-muted-foreground text-sm">Patient ID: {patientId?.slice(0, 8)}...</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {patientProfile.metadata?.dob && (
                      <Badge variant="secondary">DOB: {patientProfile.metadata.dob}</Badge>
                    )}
                    {patientProfile.metadata?.gender && (
                      <Badge variant="secondary">Gender: {patientProfile.metadata.gender}</Badge>
                    )}
                    {patientProfile.metadata?.blood_group && (
                      <Badge variant="secondary">Blood: {patientProfile.metadata.blood_group}</Badge>
                    )}
                  </div>
                </div>
                {patientProfile.metadata?.special_needs && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded text-amber-900 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block mb-1">Special Needs / Allergies</span>
                    {patientProfile.metadata.special_needs}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Medical Records</h2>
              </div>
              
              {history.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground">
                  No records found.
                </div>
              ) : (
                history.map((record: any) => (
                  <Card key={record.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {formatDate(record.date)}
                            </CardTitle>
                            <EditMedicalRecordDialog 
                              record={record} 
                              patientId={patientId!} 
                              onSubmitSuccess={refreshData} 
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            By Dr. {record.doctor?.full_name || 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="outline">Visit</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4">
                      {record.signed_url && (
                        <div className="relative group w-full aspect-video bg-muted rounded-md overflow-hidden border">
                          <img 
                            src={record.signed_url} 
                            alt="Prescription" 
                            className="w-full h-full object-contain cursor-pointer"
                            onClick={() => window.open(record.signed_url, '_blank')}
                          />
                          <Button 
                            variant="destructive" 
                            size="icon-xs" 
                            className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(record.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {record.symptoms && (
                        <div>
                          <p className="font-semibold">Symptoms and Diagnosis</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{record.symptoms}</p>
                        </div>
                      )}
                      
                      {record.solutions && (
                        <div>
                          <p className="font-semibold">Prescriptions and Remedies</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{record.solutions}</p>
                        </div>
                      )}

                      {record.suggested_tests && record.suggested_tests.length > 0 && (
                        <div>
                          <p className="font-semibold">Suggested Tests</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.suggested_tests.map((test: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-[10px]">
                                {test}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Test Results</h2>
              </div>

              {testResults.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground">
                  No results found.
                </div>
              ) : (
                testResults.map((result: any) => (
                  <Card key={result.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{result.test_name}</CardTitle>
                        {result.date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(result.date)}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground">{result.results}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </section>
          </div>
        </div>

        {!isChatOpen && (
          <div className="hidden md:flex fixed bottom-8 right-8">
            <Button 
              size="lg" 
              className="rounded-full shadow-2xl gap-2 h-14 px-6"
              onClick={() => setIsChatOpen(true)}
            >
              <Bot className="w-5 h-5" />
              Analyze Case
            </Button>
          </div>
        )}
      </div>

      {/* Collapsible Sidebar / Mobile Full-screen Overlay */}
      <aside className={cn(
        "transition-all duration-300 ease-in-out border-l bg-background flex flex-col shrink-0 z-50 h-full overflow-hidden",
        "fixed inset-0 md:relative md:inset-auto",
        isChatOpen ? "w-full md:w-80 lg:w-96 translate-x-0" : "w-0 translate-x-full md:translate-x-0 border-l-0"
      )}>
        <div className="flex-1 flex flex-col p-6 min-w-[320px] md:min-w-0 h-full min-h-0">
          <div className="flex items-center justify-between mb-2 px-1 shrink-0">
            <div className="flex items-center space-x-2">
              <Switch 
                id="full-history" 
                checked={fullHistoryEnabled}
                onCheckedChange={setFullHistoryEnabled}
              />
              <Label htmlFor="full-history" className="text-xs font-medium cursor-pointer">
                Full History Mode
              </Label>
            </div>
          </div>
          <ChatUI 
            title="Case Assistant" 
            badge="Analysis"
            placeholder="Analyze case data..."
            onClose={() => setIsChatOpen(false)}
            onSendMessage={handleSendMessage}
            initialMessages={messages}
            suggestions={["Analyze Treatment Progress"]}
          />
        </div>
      </aside>
    </div>
  )
}

