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
import { Edit2, Loader2 } from 'lucide-react'
import { updateMedicalRecordAction } from '@/app/actions/clinical-actions'
import { toast } from 'sonner'

interface EditMedicalRecordDialogProps {
  record: any
  patientId: string
  onSubmitSuccess?: () => void
}

export function EditMedicalRecordDialog({ record, patientId, onSubmitSuccess }: EditMedicalRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [symptoms, setSymptoms] = useState(record.symptoms || '')
  const [solutions, setSolutions] = useState(record.solutions || '')
  const [suggestedTests, setSuggestedTests] = useState(record.suggested_tests?.join(', ') || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await updateMedicalRecordAction(record.id, patientId, {
        symptoms,
        solutions,
        suggested_tests: suggestedTests ? suggestedTests.split(',').map((s: string) => s.trim()) : [],
      })
      
      if (res.success) {
        toast.success('Medical record updated successfully')
        setOpen(false)
        onSubmitSuccess?.()
      } else {
        toast.error('Failed to update record: ' + res.error)
      }
    } catch (error) {
      console.error('Failed to update record:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-xs" className="rounded-full">
            <Edit2 className="w-3 h-3" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Medical Record</DialogTitle>
            <DialogDescription>
              Update the symptoms, diagnosis, and prescriptions for this record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-symptoms">Symptoms and Diagnosis</Label>
              <Textarea
                id="edit-symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required={!record.image_url}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-solutions">Prescriptions and Remedies</Label>
              <Textarea
                id="edit-solutions"
                value={solutions}
                onChange={(e) => setSolutions(e.target.value)}
                required={!record.image_url}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tests">Suggested Tests (comma separated)</Label>
              <Input
                id="edit-tests"
                value={suggestedTests}
                onChange={(e) => setSuggestedTests(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
