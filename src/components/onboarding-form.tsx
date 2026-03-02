'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OnboardingFormProps {
  action: (formData: FormData) => Promise<void>
}

export function OnboardingForm({ action }: OnboardingFormProps) {
  const [role, setRole] = useState<'patient' | 'doctor'>('patient')

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="John Doe"
          required
        />
      </div>
      
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="role">I am a...</Label>
        <select 
          id="role"
          name="role" 
          value={role}
          onChange={(e) => setRole(e.target.value as 'patient' | 'doctor')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>

      {role === 'patient' ? (
        <>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              required
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <select 
              id="bloodGroup"
              name="bloodGroup" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </>
      ) : (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="medicalId">Medical ID / License Number</Label>
          <Input
            id="medicalId"
            name="medicalId"
            placeholder="MD123456"
            required
          />
        </div>
      )}

      <Button type="submit" className="w-full mt-4">
        Complete Setup
      </Button>
    </form>
  )
}
