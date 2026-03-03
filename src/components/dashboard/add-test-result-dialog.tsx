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

interface AddTestResultDialogProps {
  patientId: string
  onSubmit: (data: any) => Promise<void>
}

export function AddTestResultDialog({ patientId, onSubmit }: AddTestResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testName, setTestName] = useState('')
  const [results, setResults] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        patient_id: patientId,
        test_name: testName,
        results,
        date: new Date().toISOString(),
      })
      setOpen(false)
      setTestName('')
      setResults('')
    } catch (error) {
      console.error('Failed to add test result:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="flex gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Test Result
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Test Result</DialogTitle>
            <DialogDescription>
              Record results for a medical test performed on the patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="testName">Test Name</Label>
              <Input
                id="testName"
                placeholder="Full Blood Count, Glucose Test, etc."
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="results">Test Results</Label>
              <Textarea
                id="results"
                placeholder="Key findings, levels, or summary of the report..."
                value={results}
                onChange={(e) => setResults(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
