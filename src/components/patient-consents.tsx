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
import { Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  onApprove: (doctorId: string) => Promise<any>
  onRevoke: (doctorId: string) => Promise<any>
  onDelete: (doctorId: string) => Promise<any>
  onSearchDoctors: (query: string) => Promise<any[]>
  onGrantAccess: (doctorId: string) => Promise<any>
  onBookAppointment?: (doctorId: string, date: string) => Promise<any>
}

export function PatientConsents({ 
  initialConsents, 
  onApprove, 
  onRevoke, 
  onDelete,
  onSearchDoctors, 
  onGrantAccess,
  onBookAppointment,
}: PatientConsentsProps) {
  const [mounted, setMounted] = useState(false)
  const [consents, setConsents] = useState<Consent[]>(initialConsents)
  const [loading, setLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)
  const router = useRouter()
  
  // Booking state
  const [bookingDoctor, setBookingDoctor] = useState<Consent | null>(null)
  const [bookingDate, setBookingDate] = useState('')
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'video' | 'emergency'>('in-person')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setConsents(initialConsents)
  }, [initialConsents])

  if (!mounted) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Medical Access</CardTitle>
          <Button size="sm">Grant New Access</Button>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <p className="text-sm text-muted-foreground italic">Loading access details...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleAction = async (doctorId: string, action: 'approve' | 'revoke' | 'grant' | 'delete' | 'book') => {
    setLoading(doctorId)
    try {
      let res: any = { success: true }
      if (action === 'approve' || action === 'grant') {
        res = (await onApprove(doctorId)) || res
      } else if (action === 'revoke') {
        res = (await onRevoke(doctorId)) || res
      } else if (action === 'delete') {
        res = (await onDelete(doctorId)) || res
        if (res.success) {
          setConsents((prev) => prev.filter((c) => c.doctor_id !== doctorId))
        }
      } else if (action === 'book') {
        if (onBookAppointment && bookingDate) {
          res = (await onBookAppointment(doctorId, bookingDate, appointmentType)) || res
          if (res.success) {
            closeBooking()
          }
        }
      }

      if (res && !res.success) {
        toast.error(res.error || `Failed to ${action}`)
      } else {
        if (action !== 'book') {
          toast.success(`Successfully ${action === 'grant' ? 'requested' : action + 'd'}`)
          setIsGrantDialogOpen(false)
        }
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(null)
    }
  }

  const openBooking = async (consent: Consent) => {
    setBookingDoctor(consent)
  }

  const closeBooking = () => {
    setBookingDoctor(null)
    setBookingDate('')
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
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleAction(consent.doctor_id, 'approve')}
                        disabled={loading === consent.doctor_id}
                      >
                        Approve
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
                              Cancel
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Access Request</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the pending access request from {consent.doctor.full_name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Request</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleAction(consent.doctor_id, 'delete')}
                              variant="destructive"
                            >
                              Cancel Request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  {consent.status === 'active' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openBooking(consent)}
                      >
                        Book
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleAction(consent.doctor_id, 'revoke')}
                        disabled={loading === consent.doctor_id}
                      >
                        Revoke
                      </Button>
                    </div>
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

        {/* Manual Grant Dialog Placeholder */}
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

        {/* Booking Dialog */}
        {bookingDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Book: {bookingDoctor.doctor.full_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <Input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]} 
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.target.value)
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Consultation Type</label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={appointmentType === 'in-person' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 min-w-[100px]"
                      onClick={() => setAppointmentType('in-person')}
                    >
                      In-Person
                    </Button>
                    <Button 
                      variant={appointmentType === 'emergency' ? 'destructive' : 'outline'}
                      size="sm"
                      className={cn(
                        "flex-1 min-w-[100px]",
                        appointmentType === 'emergency' ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-200 hover:bg-red-50"
                      )}
                      onClick={() => setAppointmentType('emergency')}
                    >
                      Emergency
                    </Button>
                  </div>
                  {appointmentType === 'emergency' && (
                    <p className="text-[10px] text-red-600 font-medium">
                      * Emergency bookings prioritize your placement in the queue.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={closeBooking}>Cancel</Button>
                  <Button 
                    onClick={() => handleAction(bookingDoctor.doctor_id, 'book')} 
                    disabled={!bookingDate || loading === bookingDoctor.doctor_id}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
