'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Consent {
  id: string
  patient_id: string
  status: string
  patient: {
    full_name: string
    id: string
  }
}

interface DoctorConsentsProps {
  consents: any[]
  onViewHistory: (patientId: string) => void
}

export function DoctorConsents({ consents, onViewHistory }: DoctorConsentsProps) {
  if (consents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No patient connections yet. Search for patients to request access.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Patients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {consents.map((consent) => (
            <div key={consent.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{consent.patient.full_name}</p>
                <Badge variant={consent.status === 'active' ? 'default' : 'secondary'}>
                  {consent.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                {consent.status === 'active' ? (
                  <Button size="sm" onClick={() => onViewHistory(consent.patient_id)}>
                    View History
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-2">
                    {consent.status === 'pending' ? 'Waiting for approval' : 'Access Revoked'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
