'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PatientProfile {
  id: string
  full_name: string
  metadata: any
}

interface DoctorPatientSearchProps {
  initialResults: PatientProfile[]
  onSearch: (query: string) => Promise<PatientProfile[]>
  onRequestAccess: (patientId: string) => Promise<void>
  onDeleteConsent: (patientId: string) => Promise<void>
  existingConsents: any[]
}

export function DoctorPatientSearch({ 
  initialResults, 
  onSearch, 
  onRequestAccess, 
  onDeleteConsent,
  existingConsents 
}: DoctorPatientSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientProfile[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
        setResults([])
        return
    }
    setLoading(true)
    try {
      const data = await onSearch(query)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  const getConsentStatus = (patientId: string) => {
    const consent = existingConsents.find(c => c.patient_id === patientId)
    return consent ? consent.status : null
  }

  const handleRequestAccess = async (patientId: string) => {
    setRequesting(patientId)
    try {
      await onRequestAccess(patientId)
    } finally {
      setRequesting(null)
    }
  }

  const handleDeleteRequest = async (patientId: string) => {
    setRequesting(patientId)
    try {
      await onDeleteConsent(patientId)
    } finally {
      setRequesting(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find New Patients</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Search for patients by name..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          {results.length > 0 && results.map((patient) => {
              const status = getConsentStatus(patient.id)
              return (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{patient.full_name}</p>
                    {status && (
                      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                    )}
                  </div>
                  {!status || status === 'revoked' ? (
                    <Button 
                      size="sm" 
                      onClick={() => handleRequestAccess(patient.id)}
                      disabled={requesting === patient.id}
                    >
                      {requesting === patient.id ? 'Requesting...' : 'Request Access'}
                    </Button>
                  ) : status === 'pending' ? (
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-muted-foreground italic px-2">Request Pending</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteRequest(patient.id)}
                        disabled={requesting === patient.id}
                      >
                        {requesting === patient.id ? 'Deleting...' : 'Delete Request'}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Access Active
                    </Button>
                  )}
                </div>
              )
          })}
          {query.trim() && results.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground py-4 text-center">No patients found for "{query}".</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
