'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DataAccessLayer } from '@/lib/dal'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft, Calendar, User, FileText, Clipboard, MessageSquare, Loader2, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AddMedicalRecordDialog } from '@/components/dashboard/add-medical-record-dialog'
import { AddTestResultDialog } from '@/components/dashboard/add-test-result-dialog'
import { ReferSpecialistDialog } from '@/components/dashboard/refer-specialist-dialog'
import { ChatUI } from '@/components/dashboard/chat-ui'
import { cn } from '@/lib/utils'
import { createMedicalRecordAction, addTestResultAction } from '@/app/actions/clinical-actions'
import { chatAction } from '@/app/actions/chat-actions'
import { toast } from 'sonner'
import { Message } from '@/components/dashboard/chat-ui'

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

  // Extract data early for use in effects/handlers
  const patientProfile = data?.patientProfile
  const history = data?.history || []
  const testResults = data?.testResults || []
  const referrals = data?.referrals || []
  const user = data?.user

  const refreshData = async () => {
    if (!patientId) return
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const dal = new DataAccessLayer(supabase)
    try {
      const [profile, hist, tests, refs] = await Promise.all([
        dal.getProfile(patientId),
        dal.getPatientHistory(patientId),
        dal.getPatientTests(patientId),
        dal.getReferralForDoctorAndPatient(currentUser.id, patientId)
      ])
      setData({
        patientProfile: profile,
        history: hist as any[],
        testResults: tests,
        referrals: refs,
        user: currentUser
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async (query: string) => {
    if (!patientId || !patientProfile) return 'Error: Patient not loaded'
    const res = await chatAction(patientId, patientProfile.full_name, query, messages)
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
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [paramsPromise])

  const handleAddMedicalRecord = async (formData: any) => {
    if (!patientId) return
    const res = await createMedicalRecordAction(patientId, formData)
    if (res.success) {
      toast.success('Medical record added and indexed successfully')
      await refreshData()
    } else {
      toast.error('Failed to add medical record: ' + res.error)
    }
  }

  const handleAddTestResult = async (formData: any) => {
    if (!patientId) return
    const res = await addTestResultAction(patientId, formData)
    if (res.success) {
      toast.success('Test result added and indexed successfully')
      await refreshData()
    } else {
      toast.error('Failed to add test result: ' + res.error)
    }
  }

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
                  onSubmit={async () => { await refreshData() }} 
                />
                <AddTestResultDialog
                  patientId={patientId!}
                  onSubmit={handleAddTestResult}
                />
                <AddMedicalRecordDialog 
                  patientId={patientId!} 
                  doctorId={user.id} 
                  onSubmit={handleAddMedicalRecord} 
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
                  Referral from <span className="font-bold">{referrals[0].from_doctor?.full_name}</span> on {new Date(referrals[0].created_at).toLocaleDateString()}
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
              <div>
                <CardTitle className="text-xl md:text-2xl">{patientProfile.full_name}</CardTitle>
                <p className="text-muted-foreground text-sm">Patient ID: {patientId?.slice(0, 8)}...</p>
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
                        <CardTitle className="text-base">{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</CardTitle>
                        <Badge variant="outline">Visit</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="font-semibold mt-2">Symptoms</p>
                      <p className="text-muted-foreground">{record.symptoms}</p>
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
                      <CardTitle className="text-base">{result.test_name}</CardTitle>
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
        "transition-all duration-300 ease-in-out border-l bg-background flex flex-col shrink-0 z-50",
        "fixed inset-0 md:relative md:inset-auto",
        isChatOpen ? "w-full md:w-80 lg:w-96 translate-x-0" : "w-0 translate-x-full md:translate-x-0 overflow-hidden border-l-0"
      )}>
        <div className="flex-1 flex flex-col p-6 min-w-[320px] md:min-w-0">
          <ChatUI 
            title="Case Assistant" 
            badge="Analysis"
            placeholder="Analyze case data..."
            onClose={() => setIsChatOpen(false)}
            onSendMessage={handleSendMessage}
            initialMessages={messages}
          />
        </div>
      </aside>
    </div>
  )
}
