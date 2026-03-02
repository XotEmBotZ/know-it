import { getRecordByTokenAction } from '@/app/actions/temporary-access-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, User, Stethoscope, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SharePage({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await paramsPromise
  const res = await getRecordByTokenAction(token)

  if (!res.success || !res.record) {
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

  const record = res.record

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
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

        <Card className="shadow-lg border-primary/10">
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
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                <Stethoscope className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">Symptoms and Diagnosis</p>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{record.symptoms}</p>
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
                    {record.solutions}
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

            <div className="border-t pt-6 flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Dr. {record.doctor_name || 'N/A'}</span>
              </div>
              <p>Generated by Know-It Healthcare</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground pb-8">
          This is a secure temporary access link. The information displayed is not stored on this device.
        </p>
      </div>
    </div>
  )
}
