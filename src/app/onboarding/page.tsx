import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { OnboardingForm } from '@/components/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Check if profile already exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (profile) {
    return redirect('/dashboard')
  }

  const completeOnboarding = async (formData: FormData) => {
    'use server'

    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string
    
    // Role specific metadata
    const dob = formData.get('dob')
    const bloodGroup = formData.get('bloodGroup')
    const medicalId = formData.get('medicalId')

    const metadata = role === 'patient' 
      ? { dob, blood_group: bloodGroup }
      : { medical_id: medicalId }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Create the profile
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      role: role as 'patient' | 'doctor',
      metadata,
    })

    if (error) {
      console.error(error)
      return
    }

    return redirect('/dashboard')
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tell us about yourself</CardTitle>
          <CardDescription>
            Help us set up your profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm action={completeOnboarding} />
        </CardContent>
      </Card>
    </div>
  )
}
