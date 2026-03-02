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
import { PlusCircle, Loader2, Upload, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let imageUrl = null

      if (imageFile) {
        const supabase = createClient()
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${patientId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('prescriptions')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError
        imageUrl = fileName
      }

      await onSubmit({
        patient_id: patientId,
        doctor_id: doctorId,
        date: new Date().toISOString(),
        symptoms,
        solutions,
        suggested_tests: suggestedTests ? suggestedTests.split(',').map(s => s.trim()) : [],
        image_url: imageUrl
      })
      setOpen(false)
      setSymptoms('')
      setSolutions('')
      setSuggestedTests('')
      setImageFile(null)
      setImagePreview(null)
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
      <DialogContent className="sm:max-w-[525px] overflow-y-auto max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Medical Record</DialogTitle>
            <DialogDescription>
              Record symptoms, diagnosis, prescriptions, and remedies for the patient. You can also upload a photo of the prescription.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Prescription Image (Optional)</Label>
              {imagePreview ? (
                <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon-xs" 
                    className="absolute top-2 right-2 rounded-full"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Label 
                  htmlFor="image-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Click to upload image</span>
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </Label>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="symptoms">Symptoms and Diagnosis</Label>
              <Textarea
                id="symptoms"
                placeholder="What symptoms is the patient experiencing and what is the diagnosis?"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required={!imageFile}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="solutions">Prescriptions and Remedies</Label>
              <Textarea
                id="solutions"
                placeholder="List medications, dosages, and other remedies..."
                value={solutions}
                onChange={(e) => setSolutions(e.target.value)}
                required={!imageFile}
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
