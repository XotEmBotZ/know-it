'use client'

import { useState } from 'react'
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
  onDeleteConsent: (patientId: string) => Promise<void>
}

export function DoctorConsents({ consents, onViewHistory, onDeleteConsent }: DoctorConsentsProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (patientId: string) => {
    setDeleting(patientId)
    try {
      await onDeleteConsent(patientId)
    } finally {
      setDeleting(null)
    }
  }

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
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs text-muted-foreground italic px-2">
                      {consent.status === 'pending' ? 'Waiting for approval' : 'Access Revoked'}
                    </p>
                    {consent.status === 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(consent.patient_id)}
                        disabled={deleting === consent.patient_id}
                      >
                        {deleting === consent.patient_id ? 'Deleting...' : 'Delete Request'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
