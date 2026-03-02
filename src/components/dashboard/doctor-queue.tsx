'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, FastForward, User, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface DoctorQueueProps {
  queue: any[]
  onMarkDone: (id: string) => Promise<any>
  onSkip: (id: string) => Promise<any>
}

export function DoctorQueue({ queue, onMarkDone, onSkip }: DoctorQueueProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const safeQueue = queue || []
  const currentPatient = safeQueue[0]

  const handleAction = async (id: string, action: 'done' | 'skip') => {
    setLoading(id)
    try {
      const res = action === 'done' ? await onMarkDone(id) : await onSkip(id)
      if (res.success) toast.success(`Patient marked as ${action === 'done' ? 'completed' : 'skipped'}`)
      else toast.error(res.error || `Failed to mark patient as ${action}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/50 bg-primary/5 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <User className="w-5 h-5" />
            Active Patient (Next in Line)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPatient ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold">{currentPatient.patient?.full_name || 'Unknown Patient'}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="secondary" className="font-mono text-lg">#{currentPatient.queue_number}</Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleAction(currentPatient.id, 'skip')} 
                  variant="outline" 
                  className="gap-2 h-12 px-6"
                  disabled={loading === currentPatient.id}
                >
                  <FastForward className="w-4 h-4" />
                  Skip
                </Button>
                <Button 
                  onClick={() => handleAction(currentPatient.id, 'done')} 
                  className="gap-2 h-12 px-6"
                  disabled={loading === currentPatient.id}
                >
                  <Check className="w-4 h-4" />
                  Mark as Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No pending patients in the queue for today.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {safeQueue.length > 1 ? (
            <div className="flex flex-col gap-3">
              {safeQueue.slice(1).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono">#{item.queue_number}</Badge>
                    <div>
                      <p className="font-semibold">{item.patient?.full_name || 'Unknown Patient'}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleAction(item.id, 'skip')}
                    disabled={loading === item.id}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Skip
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No other patients waiting.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
