'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/alert-dialog'

interface Consent {
  id: string
  doctor_id: string
  status: string
  doctor: {
    full_name: string
    id: string
    metadata: any
  }
}

interface PatientConsentsProps {
  initialConsents: any[]
  onApprove: (doctorId: string) => Promise<void>
  onRevoke: (doctorId: string) => Promise<void>
  onSearchDoctors: (query: string) => Promise<any[]>
  onGrantAccess: (doctorId: string) => Promise<void>
}

export function PatientConsents({ 
  initialConsents, 
  onApprove, 
  onRevoke, 
  onSearchDoctors, 
  onGrantAccess 
}: PatientConsentsProps) {
  const [consents, setConsents] = useState<Consent[]>(initialConsents)
  const [loading, setLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAction = async (doctorId: string, action: 'approve' | 'revoke' | 'grant') => {
    setLoading(doctorId)
    try {
      if (action === 'approve' || action === 'grant') {
        await onApprove(doctorId)
      } else {
        await onRevoke(doctorId)
      }
      setIsDialogOpen(false)
    } finally {
      setLoading(null)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await onSearchDoctors(searchQuery)
      setSearchResults(results)
    } finally {
      setSearching(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Medical Access</CardTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          Grant New Access
        </Button>
      </CardHeader>
      <CardContent>
        {consents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No access requests or active consents.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {consents.map((consent) => (
              <div key={consent.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{consent.doctor.full_name}</p>
                  <p className="text-xs text-muted-foreground">ID: {consent.doctor.metadata?.medical_id}</p>
                  <Badge className="mt-1" variant={consent.status === 'active' ? 'default' : 'secondary'}>
                    {consent.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {consent.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleAction(consent.doctor_id, 'approve')}
                      disabled={loading === consent.doctor_id}
                    >
                      Approve
                    </Button>
                  )}
                  {consent.status === 'active' && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleAction(consent.doctor_id, 'revoke')}
                      disabled={loading === consent.doctor_id}
                    >
                      Revoke
                    </Button>
                  )}
                  {consent.status === 'revoked' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleAction(consent.doctor_id, 'approve')}
                      disabled={loading === consent.doctor_id}
                    >
                      Re-grant
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Grant Dialog Placeholder (Simulated with conditional rendering for now) */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Grant Access to Doctor</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Search by name or Medical ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? '...' : 'Search'}
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                  {searchResults.map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{doctor.full_name}</p>
                        <p className="text-xs text-muted-foreground">{doctor.metadata?.medical_id}</p>
                      </div>
                      <Button 
                        size="xs" 
                        onClick={() => handleAction(doctor.id, 'grant')}
                        disabled={loading === doctor.id}
                      >
                        Grant
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
