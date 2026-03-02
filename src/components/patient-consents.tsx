'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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
  onDelete: (doctorId: string) => Promise<void>
  onSearchDoctors: (query: string) => Promise<any[]>
  onGrantAccess: (doctorId: string) => Promise<void>
}

export function PatientConsents({ 
  initialConsents, 
  onApprove, 
  onRevoke, 
  onDelete,
  onSearchDoctors, 
  onGrantAccess 
}: PatientConsentsProps) {
  const [consents, setConsents] = useState<Consent[]>(initialConsents)
  const [loading, setLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)

  useEffect(() => {
    setConsents(initialConsents)
  }, [initialConsents])

  const handleAction = async (doctorId: string, action: 'approve' | 'revoke' | 'grant' | 'delete') => {
    setLoading(doctorId)
    try {
      if (action === 'approve' || action === 'grant') {
        await onApprove(doctorId)
      } else if (action === 'revoke') {
        await onRevoke(doctorId)
      } else if (action === 'delete') {
        await onDelete(doctorId)
        setConsents((prev) => prev.filter((c) => c.doctor_id !== doctorId))
      }
      setIsGrantDialogOpen(false)
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
        <Button size="sm" onClick={() => setIsGrantDialogOpen(true)}>
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
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleAction(consent.doctor_id, 'approve')}
                        disabled={loading === consent.doctor_id}
                      >
                        Re-grant
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger 
                          render={
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={loading === consent.doctor_id}
                            >
                              Delete
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Access Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the revoked access request for {consent.doctor.full_name}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleAction(consent.doctor_id, 'delete')}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual Grant Dialog Placeholder (Simulated with conditional rendering for now) */}
        {isGrantDialogOpen && (
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
                  <Button variant="ghost" onClick={() => setIsGrantDialogOpen(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
