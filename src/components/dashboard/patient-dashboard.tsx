'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PatientConsents } from '@/components/patient-consents'

interface PatientDashboardProps {
  profile: any
  consents: any[]
  history: any[]
  tests: any[]
  signOut: () => Promise<void>
  approveConsent: (doctorId: string) => Promise<void>
  revokeConsent: (doctorId: string) => Promise<void>
  deleteConsent: (doctorId: string) => Promise<void>
  searchDoctors: (query: string) => Promise<any[]>
}

export function PatientDashboard({
  profile,
  consents,
  history,
  tests,
  signOut,
  approveConsent,
  revokeConsent,
  deleteConsent,
  searchDoctors,
}: PatientDashboardProps) {
  const metadata = profile.metadata as any

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {profile.full_name}</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">Sign Out</Button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p><span className="font-semibold">Role:</span> <span className="capitalize">{profile.role}</span></p>
            <p><span className="font-semibold">DOB:</span> {metadata?.dob}</p>
            <p><span className="font-semibold">Blood Group:</span> {metadata?.blood_group}</p>
          </CardContent>
        </Card>

        <PatientConsents 
          initialConsents={consents} 
          onApprove={approveConsent}
          onRevoke={revokeConsent}
          onDelete={deleteConsent}
          onSearchDoctors={searchDoctors}
          onGrantAccess={approveConsent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="flex flex-col gap-4">
                {history.map((record) => (
                  <div key={record.id} className="p-4 border rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold">{record.doctor?.full_name || 'Doctor'}</p>
                      <p className="text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm"><span className="font-medium">Symptoms:</span> {record.symptoms}</p>
                    <p className="text-sm"><span className="font-medium">Solutions:</span> {record.solutions}</p>
                    {record.suggested_tests && record.suggested_tests.length > 0 && (
                      <p className="text-sm">
                        <span className="font-medium">Suggested Tests:</span> {record.suggested_tests.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No medical history found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {tests && tests.length > 0 ? (
              <div className="flex flex-col gap-4">
                {tests.map((test) => (
                  <div key={test.id} className="p-4 border rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold">{test.test_name}</p>
                      <p className="text-sm text-muted-foreground">{new Date(test.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm"><span className="font-medium">Results:</span> {test.results}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No test results found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-12 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-center">
          AI health chat and other insights will appear here.
        </div>
      </div>
    </div>
  )
}
