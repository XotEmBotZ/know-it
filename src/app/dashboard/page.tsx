import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/login')
  }

  const metadata = profile?.metadata as any

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}</h1>
        <form action={signOut}>
          <Button type="submit" variant="outline">Sign Out</Button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p><span className="font-semibold">Role:</span> <span className="capitalize">{profile?.role}</span></p>
            {profile?.role === 'patient' ? (
              <>
                <p><span className="font-semibold">DOB:</span> {metadata?.dob}</p>
                <p><span className="font-semibold">Blood Group:</span> {metadata?.blood_group}</p>
              </>
            ) : (
              <p><span className="font-semibold">Medical ID:</span> {metadata?.medical_id}</p>
            )}
          </CardContent>
        </Card>
        
        <div className="p-6 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-center">
          Dashboard features for {profile?.role} coming soon...
        </div>
      </div>
    </div>
  )
}
