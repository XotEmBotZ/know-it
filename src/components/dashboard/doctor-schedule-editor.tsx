'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, MapPin, Save, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface DoctorScheduleEditorProps {
  schedule: any[]
  status: any
  onUpdateStatus: (isUrgent: boolean, message: string) => Promise<any>
  onUpdateSchedule: (day: number, start: string, end: string, location: string) => Promise<any>
  onDeleteSlot?: (slotId: string) => Promise<any>
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function DoctorScheduleEditor({ 
  schedule, 
  status, 
  onUpdateStatus, 
  onUpdateSchedule,
  onDeleteSlot
}: DoctorScheduleEditorProps) {
  const [isUrgent, setIsUrgent] = useState(status?.is_urgent || false)
  const [urgentMessage, setUrgentMessage] = useState(status?.message || '')
  const [isAddingSlot, setIsAddingSlot] = useState<number | null>(null)
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '17:00', location: '' })
  const [loading, setLoading] = useState(false)

  const safeSchedule = schedule || []

  const handleStatusUpdate = async () => {
    setLoading(true)
    try {
      const res = await onUpdateStatus(isUrgent, urgentMessage)
      if (res.success) toast.success('Status updated')
      else toast.error(res.error || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async (day: number) => {
    setLoading(true)
    try {
      const res = await onUpdateSchedule(day, newSlot.start, newSlot.end, newSlot.location)
      if (res.success) {
        toast.success('Schedule slot added')
        setIsAddingSlot(null)
        setNewSlot({ start: '09:00', end: '17:00', location: '' })
      } else {
        toast.error(res.error || 'Failed to add slot')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (slotId: string) => {
    if (!onDeleteSlot) return
    setLoading(true)
    try {
      const res = await onDeleteSlot(slotId)
      if (res.success) toast.success('Slot deleted')
      else toast.error(res.error || 'Failed to delete slot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="urgent-mode" checked={isUrgent} onCheckedChange={setIsUrgent} />
            <Label htmlFor="urgent-mode">Urgent Mode (Notify Patients)</Label>
          </div>
          {isUrgent && (
            <div className="flex flex-col gap-2">
              <Label>Message to Patients</Label>
              <Input 
                placeholder="e.g. Sorry, I have an urgent surgery. Rescheduling today's appointments." 
                value={urgentMessage}
                onChange={(e) => setUrgentMessage(e.target.value)}
              />
            </div>
          )}
          <Button onClick={handleStatusUpdate} disabled={loading} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Update Status
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule & Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {DAYS.map((day, dayIndex) => {
              const daySlots = safeSchedule.filter(s => s.day_of_week === dayIndex)
              const addingThisDay = isAddingSlot === dayIndex

              return (
                <div key={day} className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg">{day}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddingSlot(addingThisDay ? null : dayIndex)}
                      disabled={loading}
                    >
                      {addingThisDay ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> Add Slot</>}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {daySlots.length === 0 && !addingThisDay && (
                      <p className="text-sm text-muted-foreground italic">No slots scheduled</p>
                    )}
                    
                    {daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 border rounded bg-background shadow-sm">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2 font-medium">
                            <Clock className="w-3 h-3 text-primary" /> 
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3 h-3" /> 
                            {slot.location}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(slot.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {addingThisDay && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 border-2 border-dashed border-primary/30 rounded-lg">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">Start Time</Label>
                          <Input type="time" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs">End Time</Label>
                          <Input type="time" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <Label className="text-xs">Location</Label>
                          <Input placeholder="Clinic Name, City" value={newSlot.location} onChange={e => setNewSlot({...newSlot, location: e.target.value})} />
                        </div>
                        <Button className="md:col-span-2" size="sm" onClick={() => handleAddSlot(dayIndex)} disabled={loading || !newSlot.location}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Slot
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
