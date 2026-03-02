'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DoctorConsents } from '@/components/doctor-consents'
import { DoctorPatientSearch } from '@/components/doctor-patient-search'

interface DoctorDashboardProps {
  profile: any
  consents: any[]
  signOut: () => Promise<void>
  searchPatients: (query: string) => Promise<any[]>
  requestAccess: (patientId: string) => Promise<void>
  deleteConsent: (patientId: string) => Promise<void>
  viewHistory: (patientId: string) => Promise<void>
}

export function DoctorDashboard({
  profile,
  consents,
  signOut,
  searchPatients,
  requestAccess,
  deleteConsent,
  viewHistory,
}: DoctorDashboardProps) {
  const metadata = profile.metadata as any

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Doctor Portal: {profile.full_name}</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">Sign Out</Button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Professional Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p><span className="font-semibold">Role:</span> <span className="capitalize">{profile.role}</span></p>
            <p><span className="font-semibold">Medical ID:</span> {metadata?.medical_id}</p>
          </CardContent>
        </Card>

        <DoctorConsents 
          consents={consents} 
          onViewHistory={viewHistory}
          onDeleteConsent={deleteConsent}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DoctorPatientSearch 
          initialResults={[]}
          onSearch={searchPatients}
          onRequestAccess={requestAccess}
          onDeleteConsent={deleteConsent}
          existingConsents={consents}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="p-12 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-center">
          Select a patient from "My Patients" to view their records.
        </div>
      </div>
    </div>
  )
}
