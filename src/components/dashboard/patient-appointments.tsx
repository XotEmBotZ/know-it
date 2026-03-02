'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, AlertTriangle, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface PatientAppointmentsProps {
  appointments: any[]
}

export function PatientAppointments({ appointments }: PatientAppointmentsProps) {
  const [queueAhead, setQueueAhead] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    async function fetchDetails() {
      const doctorIds = [...new Set((appointments || []).map(a => a.doctor_id))].filter(Boolean)
      if (doctorIds.length === 0) return

      // Fetch queue ahead for today's appointments
      const today = new Date().toISOString().split('T')[0]
      const todayApps = (appointments || []).filter(a => a.appointment_date === today)
      
      const aheadMap: Record<string, number> = {}
      for (const app of todayApps) {
        const { count } = await supabase
          .from('appointment_queue')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', app.doctor_id)
          .eq('appointment_date', today)
          .eq('status', 'pending')
          .lt('queue_number', app.queue_number)
        
        aheadMap[app.id] = count || 0
      }
      setQueueAhead(aheadMap)
    }

    fetchDetails()
  }, [appointments, supabase])

  const safeAppointments = appointments || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {safeAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {safeAppointments.map((app) => {
              const aheadCount = queueAhead[app.id]
              const isToday = new Date(app.appointment_date).toDateString() === new Date().toDateString()

              return (
                <div key={app.id} className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm bg-background">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{app.doctor?.full_name || 'Doctor'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.appointment_date).toLocaleDateString()}
                        <Badge variant="secondary" className="ml-2 font-mono">Queue #{app.queue_number}</Badge>
                      </div>
                    </div>
                    {isToday && (
                      <Badge variant="outline" className="border-green-500 text-green-600 animate-pulse">Today</Badge>
                    )}
                  </div>

                  {isToday && typeof aheadCount === 'number' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      <Users className="w-4 h-4" />
                      <span>{aheadCount === 0 ? 'You are next in line!' : `${aheadCount} patient(s) ahead of you`}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
