'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, Loader2, Search, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { DataAccessLayer } from '@/lib/dal'
import { Card } from '@/components/ui/card'

interface ReferSpecialistDialogProps {
  patientId: string
  fromDoctorId: string
  onSubmit: (data: any) => Promise<void>
}

export function ReferSpecialistDialog({ patientId, fromDoctorId, onSubmit }: ReferSpecialistDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [specialists, setSpecialists] = useState<any[]>([])
  const [selectedSpecialist, setSelectedSpecialist] = useState<any | null>(null)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const searchDoctors = async () => {
      if (searchQuery.length < 2) {
        setSpecialists([])
        return
      }
      setSearching(true)
      try {
        const supabase = createClient()
        const dal = new DataAccessLayer(supabase)
        const results = await dal.searchSpecialists(searchQuery)
        // Filter out the current doctor
        setSpecialists(results.filter(d => d.id !== fromDoctorId))
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setSearching(false)
      }
    }

    const timer = setTimeout(searchDoctors, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, fromDoctorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSpecialist) return

    setLoading(true)
    try {
      await onSubmit({
        patient_id: patientId,
        from_doctor_id: fromDoctorId,
        to_doctor_id: selectedSpecialist.id,
        reason,
        notes,
        status: 'pending'
      })
      setOpen(false)
      setReason('')
      setNotes('')
      setSelectedSpecialist(null)
      setSearchQuery('')
    } catch (error) {
      console.error('Failed to create referral:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="flex gap-2">
            <UserPlus className="w-4 h-4" />
            Refer Specialist
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Refer to Specialist</DialogTitle>
            <DialogDescription>
              Refer this patient to a specialist for further consultation or treatment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Search Specialist</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter doctor's name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {searching && <div className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Searching...</div>}
              
              {!selectedSpecialist && specialists.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto bg-card">
                  {specialists.map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      className="w-full text-left p-2 hover:bg-muted transition-colors border-b last:border-0 flex items-center gap-2"
                      onClick={() => {
                        setSelectedSpecialist(doc)
                        setSearchQuery(doc.full_name)
                        setSpecialists([])
                      }}
                    >
                      <User className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{doc.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{doc.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedSpecialist && (
                <Card className="p-3 bg-primary/5 border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{selectedSpecialist.full_name}</p>
                      <p className="text-xs text-muted-foreground">Specialist Selected</p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSelectedSpecialist(null)
                      setSearchQuery('')
                    }}
                    className="h-8 text-xs"
                  >
                    Change
                  </Button>
                </Card>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Referral</Label>
              <Input
                id="reason"
                placeholder="e.g., Complex diagnosis, Surgery consultation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                placeholder="Details for the specialist..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !selectedSpecialist}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Referral
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
