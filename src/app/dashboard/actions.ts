'use server'

import { createClient } from '@/utils/supabase/server'
import { DataAccessLayer } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAuthenticatedDAL() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { dal: new DataAccessLayer(supabase), userId: user.id }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}

export async function approveConsent(doctorId: string) {
  try {
    const { dal, userId } = await getAuthenticatedDAL()
    await dal.grantConsent(userId, doctorId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function revokeConsent(doctorId: string) {
  try {
    const { dal, userId } = await getAuthenticatedDAL()
    await dal.revokeConsent(userId, doctorId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteConsent(doctorId: string) {
  try {
    const { dal, userId } = await getAuthenticatedDAL()
    await dal.deleteConsent(userId, doctorId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function searchDoctors(query: string) {
  const { dal } = await getAuthenticatedDAL()
  return dal.searchDoctor(query)
}

export async function searchPatients(query: string) {
  const { dal } = await getAuthenticatedDAL()
  return dal.searchPatient(query)
}

export async function requestAccess(patientId: string) {
  try {
    const { dal, userId } = await getAuthenticatedDAL()
    await dal.requestConsent(userId, patientId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function doctorDeleteConsent(patientId: string) {
  try {
    const { dal, userId } = await getAuthenticatedDAL()
    await dal.deleteConsent(patientId, userId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markDone(id: string) {
  try {
    const { dal } = await getAuthenticatedDAL()
    await dal.markAppointmentDone(id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function skipPatient(id: string) {
  try {
    const { dal } = await getAuthenticatedDAL()
    await dal.skipAppointment(id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function bookAppointment(doctorId: string, date: string, type: string = 'in-person') {
  try {
    const { dal, userId } = await getAuthenticatedDAL()
    await dal.bookAppointment(doctorId, userId, date, type)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to book appointment' }
  }
}

export async function cancelAppointment(id: string) {
  try {
    const { dal, userId } = await getAuthenticatedDAL()
    await dal.cancelAppointment(id, userId)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to cancel appointment' }
  }
}

export async function createReferral(data: any) {
  try {
    const { dal } = await getAuthenticatedDAL()
    await dal.createReferral(data)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create referral' }
  }
}

export async function addMedicalRecord(data: any) {
  try {
    const { dal } = await getAuthenticatedDAL()
    await dal.addMedicalRecord(data)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add medical record' }
  }
}

export async function addTestResult(data: any) {
  try {
    const { dal } = await getAuthenticatedDAL()
    await dal.addTestResult(data)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add test result' }
  }
}

export async function viewHistory(patientId: string) {
  return redirect(`/dashboard/patient/${patientId}`)
}
