'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PatientConsents } from '@/components/patient-consents'

interface PatientDashboardProps {
  profile: any
  consents: any[]
  signOut: () => Promise<void>
  approveConsent: (doctorId: string) => Promise<void>
  revokeConsent: (doctorId: string) => Promise<void>
  searchDoctors: (query: string) => Promise<any[]>
}

export function PatientDashboard({
  profile,
  consents,
  signOut,
  approveConsent,
  revokeConsent,
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
          onSearchDoctors={searchDoctors}
          onGrantAccess={approveConsent}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-12 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-center">
          Your medical history and AI health chat will appear here.
        </div>
      </div>
    </div>
  )
}
