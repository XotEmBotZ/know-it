'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRecordByTokenAction, updateRecordByTokenAction } from '@/app/actions/temporary-access-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, User, Stethoscope, AlertCircle, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SharePage({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>
}) {
  const [token, setToken] = useState<string | null>(null)
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [symptoms, setSymptoms] = useState('')
  const [solutions, setSolutions] = useState('')
  const [suggestedTests, setSuggestedTests] = useState('')

  const fetchRecord = useCallback(async (tokenId: string) => {
    const res = await getRecordByTokenAction(tokenId)
    if (res.success && res.record) {
      setRecord(res.record)
      setSymptoms(res.record.symptoms || '')
      setSolutions(res.record.solutions || '')
      setSuggestedTests(res.record.suggested_tests?.join(', ') || '')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    paramsPromise.then(p => {
      setToken(p.token)
      fetchRecord(p.token)
    })
  }, [paramsPromise, fetchRecord])

  const handleUpdate = async () => {
    if (!token) return
    setSaving(true)
    const res = await updateRecordByTokenAction(token, {
      symptoms,
      solutions,
      suggested_tests: suggestedTests ? suggestedTests.split(',').map(s => s.trim()) : []
    })
    setSaving(false)

    if (res.success) {
      toast.success('Medical record updated successfully')
      // Refresh local state
      setRecord((prev: any) => ({
        ...prev,
        symptoms,
        solutions,
        suggested_tests: suggestedTests ? suggestedTests.split(',').map(s => s.trim()) : []
      }))
    } else {
      toast.error('Failed to update: ' + res.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold">Access Expired or Invalid</h1>
              <p className="text-muted-foreground">
                This link is no longer active. Please ask the patient for a new link.
              </p>
            </div>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 items-center text-center mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Know-It Prescription
          </h1>
          <p className="text-muted-foreground">Verified Medical Record Access</p>
          <Badge variant="secondary" className="mt-2">
            Access expires: {new Date(record.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 h-fit">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Patient</p>
                      <CardTitle className="text-lg">{record.patient_name}</CardTitle>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date</p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {record.image_url && (
                  <div className="w-full bg-muted rounded-lg overflow-hidden border">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/prescriptions/${record.image_url}`} 
                      alt="Prescription Photo" 
                      className="w-full object-contain cursor-pointer max-h-[500px]"
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/prescriptions/${record.image_url}`, '_blank')}
                    />
                    <div className="p-2 bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Original Prescription Photo (Click to enlarge)</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                    <Stethoscope className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Symptoms and Diagnosis</p>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{record.symptoms || 'No digital symptoms recorded yet.'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-full shrink-0">
                    <FileText className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="space-y-1 w-full">
                    <p className="font-bold text-slate-900">Prescriptions and Remedies</p>
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                      <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                        {record.solutions || 'No digital prescriptions recorded yet.'}
                      </p>
                    </div>
                  </div>
                </div>

                {record.suggested_tests && record.suggested_tests.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-100 rounded-full shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-slate-900">Suggested Tests</p>
                      <div className="flex flex-wrap gap-2">
                        {record.suggested_tests.map((test: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-white">
                            {test}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pharmacist Edit Panel */}
          <div className="space-y-6">
            <Card className="shadow-md border-amber-200">
              <CardHeader className="bg-amber-50 border-b border-amber-100">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                  <Edit2Icon className="w-4 h-4" />
                  Digitalize Record
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Update digital details based on physical prescription or pharmacist review.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Symptoms/Diagnosis</Label>
                  <Textarea 
                    id="symptoms" 
                    className="text-xs min-h-[100px]"
                    placeholder="Enter diagnosis details..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="solutions">Digital Prescription</Label>
                  <Textarea 
                    id="solutions" 
                    className="text-xs min-h-[100px]"
                    placeholder="Enter medications and dosages..."
                    value={solutions}
                    onChange={(e) => setSolutions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tests">Tests (comma separated)</Label>
                  <Input 
                    id="tests" 
                    className="text-xs"
                    placeholder="Blood test, X-ray..."
                    value={suggestedTests}
                    onChange={(e) => setSuggestedTests(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full gap-2" 
                  size="sm" 
                  onClick={handleUpdate} 
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-primary">Pharmacist Portal:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Verify medications against the physical image.</li>
                <li>Digitalize content for patient AI assistance.</li>
                <li>Updates are instantly visible to both doctor and patient.</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-8">
          This is a secure temporary access link. Dr. {record.doctor_name || 'N/A'} is the treating physician.
        </p>
      </div>
    </div>
  )
}

function Edit2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}
