'use client'

import { useState } from 'react'
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
import { PlusCircle, Loader2 } from 'lucide-react'

interface AddMedicalRecordDialogProps {
  patientId: string
  doctorId: string
  onSubmit: (data: any) => Promise<void>
}

export function AddMedicalRecordDialog({ patientId, doctorId, onSubmit }: AddMedicalRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [symptoms, setSymptoms] = useState('')
  const [solutions, setSolutions] = useState('')
  const [suggestedTests, setSuggestedTests] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        patient_id: patientId,
        doctor_id: doctorId,
        date: new Date().toISOString(),
        symptoms,
        solutions,
        suggested_tests: suggestedTests ? suggestedTests.split(',').map(s => s.trim()) : [],
      })
      setOpen(false)
      setSymptoms('')
      setSolutions('')
      setSuggestedTests('')
    } catch (error) {
      console.error('Failed to add record:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="flex gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Record
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Medical Record</DialogTitle>
            <DialogDescription>
              Record symptoms, diagnosis, prescriptions, and remedies for the patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="symptoms">Symptoms and Diagnosis</Label>
              <Textarea
                id="symptoms"
                placeholder="What symptoms is the patient experiencing and what is the diagnosis?"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="solutions">Prescriptions and Remedies</Label>
              <Textarea
                id="solutions"
                placeholder="List medications, dosages, and other remedies..."
                value={solutions}
                onChange={(e) => setSolutions(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tests">Suggested Tests (comma separated)</Label>
              <Input
                id="tests"
                placeholder="Blood Test, X-Ray, etc."
                value={suggestedTests}
                onChange={(e) => setSuggestedTests(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
