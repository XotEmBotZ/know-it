import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DataAccessLayer } from '@/lib/dal'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft, Calendar, User, FileText, Clipboard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AddMedicalRecordDialog } from '@/components/dashboard/add-medical-record-dialog'
import { AddTestResultDialog } from '@/components/dashboard/add-test-result-dialog'
import { ReferSpecialistDialog } from '@/components/dashboard/refer-specialist-dialog'
import { revalidatePath } from 'next/cache'

export default async function PatientHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: patientId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const dal = new DataAccessLayer(supabase)
  const doctorProfile = await dal.getProfile(user.id)

  if (doctorProfile.role !== 'doctor') {
    return redirect('/dashboard')
  }

  // --- Server Actions ---
  async function addMedicalRecord(data: any) {
    'use server'
    const supabase = await createClient()
    const dal = new DataAccessLayer(supabase)
    await dal.createMedicalRecord(data)
    revalidatePath(`/dashboard/patient/${patientId}`)
  }

  async function addTestResult(data: any) {
    'use server'
    const supabase = await createClient()
    const dal = new DataAccessLayer(supabase)
    await dal.addTestResult(data)
    revalidatePath(`/dashboard/patient/${patientId}`)
  }

  async function createReferral(data: any) {
    'use server'
    const supabase = await createClient()
    const dal = new DataAccessLayer(supabase)
    await dal.createReferral(data)
    revalidatePath(`/dashboard/patient/${patientId}`)
  }

  // Fetch data, handle potential RLS or missing profile errors
  let patientProfile: any = null
  let history: any[] = []
  let testResults: any[] = []
  let referrals: any[] = []

  try {
    patientProfile = await dal.getProfile(patientId)
  } catch (err) {
    console.error('Error fetching patient profile:', err)
  }

  try {
    history = await dal.getPatientHistory(patientId) as any[]
    testResults = await dal.getPatientTests(patientId)
    referrals = await dal.getReferralForDoctorAndPatient(user.id, patientId)
  } catch (err) {
    console.error('Error fetching patient records:', err)
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
    <div className="flex-1 w-full flex flex-col gap-8 p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Patient History</h1>
        </div>
        <div className="flex gap-2">
          <ReferSpecialistDialog
            patientId={patientId}
            fromDoctorId={user.id}
            onSubmit={createReferral}
          />
          <AddMedicalRecordDialog 
            patientId={patientId} 
            doctorId={user.id} 
            onSubmit={addMedicalRecord} 
          />
          <AddTestResultDialog 
            patientId={patientId} 
            onSubmit={addTestResult} 
          />
        </div>
      </div>

      {referrals && referrals.length > 0 && (
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-700 flex items-center gap-2">
              <Clipboard className="w-5 h-5" />
              Incoming Referral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Referring Doctor</p>
                <p className="text-lg font-bold text-emerald-900">{referrals[0].from_doctor?.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Referral Date</p>
                <p className="text-lg font-bold text-emerald-900">{new Date(referrals[0].created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Reason for Referral</p>
              <p className="text-emerald-900 font-medium">{referrals[0].reason}</p>
            </div>
            {referrals[0].notes && (
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Clinical Notes</p>
                <p className="text-emerald-900/80 text-sm whitespace-pre-wrap">{referrals[0].notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">{patientProfile.full_name}</CardTitle>
            <p className="text-muted-foreground capitalize">{patientProfile.role}</p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
            <p>{(patientProfile.metadata as any)?.dob || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
            <p className="uppercase">{(patientProfile.metadata as any)?.blood_group || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Medical Records</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground">
              No medical records found.
            </div>
          ) : (
            history.map((record) => (
              <Card key={record.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Visit on {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</CardTitle>
                    <Badge variant="outline" className="flex gap-1 items-center">
                      <Calendar className="w-3 h-3" />
                      Record
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Physician: {record.doctor?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Symptoms</p>
                    <p className="text-sm">{record.symptoms}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Diagnosis/Solutions</p>
                    <p className="text-sm">{record.solutions}</p>
                  </div>
                  {record.suggested_tests && record.suggested_tests.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold">Suggested Tests</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.suggested_tests.map((test: string, i: number) => (
                          <Badge key={i} variant="secondary">{test}</Badge>
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
              No test results found.
            </div>
          ) : (
            testResults.map((result) => (
              <Card key={result.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{result.test_name}</CardTitle>
                    <Badge variant="outline" className="flex gap-1 items-center">
                      <Calendar className="w-3 h-3" />
                      {result.date ? new Date(result.date).toLocaleDateString() : 'N/A'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">Result</p>
                  <p className="text-sm">{result.results}</p>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  )
}
