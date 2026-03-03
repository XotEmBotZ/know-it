'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, FastForward, User, Video, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DoctorQueueProps {
  queue: any[]
  onMarkDone: (id: string) => Promise<any>
  onSkip: (id: string) => Promise<any>
}

export function DoctorQueue({ queue, onMarkDone, onSkip }: DoctorQueueProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [activeVideoCall, setActiveVideoCall] = useState<string | null>(null)

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
    <>
    <div className="flex flex-col gap-6">
      <Card className="border-primary/50 bg-primary/5 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Active Patient (Next in Line)
            </div>
            {currentPatient?.appointment_type === 'video' && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex gap-1 items-center">
                <Video className="w-3 h-3" />
                Video Call
              </Badge>
            )}
            {currentPatient?.appointment_type === 'emergency' && (
              <Badge variant="destructive" className="bg-red-600 flex gap-1 items-center">
                Emergency
              </Badge>
            )}
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
              <div className="flex flex-wrap gap-3">
                {currentPatient.appointment_type === 'video' && (
                  <Button 
                    onClick={() => setActiveVideoCall(currentPatient.patient?.full_name)} 
                    className="gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    <Video className="w-4 h-4" />
                    Join Call
                  </Button>
                )}
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{item.patient?.full_name || 'Unknown Patient'}</p>
                        {item.appointment_type === 'video' && (
                          <Badge variant="outline" className="text-[10px] h-4 bg-blue-50 text-blue-600 border-blue-100">Video</Badge>
                        )}
                      </div>
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

    <Dialog open={!!activeVideoCall} onOpenChange={(open) => !open && setActiveVideoCall(null)}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Video Consultation: {activeVideoCall}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 bg-slate-900 relative flex items-center justify-center">
          {/* Video Placeholder */}
          <div className="text-center text-slate-400 space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
              <Video className="w-10 h-10" />
            </div>
            <p className="text-lg font-medium">Connecting to secure video session...</p>
            <p className="text-sm">Please allow camera and microphone access when prompted.</p>
          </div>
          
          {/* Controls Placeholder */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Clock className="w-5 h-5" /> {/* Mic placeholder icon */}
            </Button>
            <Button variant="destructive" size="lg" className="rounded-full px-8" onClick={() => setActiveVideoCall(null)}>
              End Call
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Video className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
