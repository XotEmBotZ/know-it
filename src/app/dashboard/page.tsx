import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DataAccessLayer } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { PatientDashboard } from '@/components/dashboard/patient-dashboard'
import { DoctorDashboard } from '@/components/dashboard/doctor-dashboard'

export default async function DashboardPage() {
	const supabase = await createClient()

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		return redirect('/login')
	}

	const dal = new DataAccessLayer(supabase)
	const profile = await dal.getProfile(user.id)

	if (!profile) {
		return redirect('/onboarding')
	}

	// --- Common Actions ---
	async function signOut() {
		'use server'
		const supabase = await createClient()
		await supabase.auth.signOut()
		return redirect('/login')
	}

	// --- Patient Actions ---
	async function approveConsent(doctorId: string) {
		'use server'
		const supabase = await createClient()
		const dal = new DataAccessLayer(supabase)
		await dal.grantConsent(user!.id, doctorId)
		revalidatePath('/dashboard')
	}

	async function revokeConsent(doctorId: string) {
		'use server'
		const supabase = await createClient()
		const dal = new DataAccessLayer(supabase)
		await dal.revokeConsent(user!.id, doctorId)
		revalidatePath('/dashboard')
	}

	async function deleteConsent(doctorId: string) {
		'use server'
		const supabase = await createClient()
		const dal = new DataAccessLayer(supabase)
		await dal.deleteConsent(user!.id, doctorId)
		revalidatePath('/dashboard')
	}

	async function searchDoctors(query: string) {
		'use server'
		const supabase = await createClient()
		const dal = new DataAccessLayer(supabase)
		return dal.searchDoctor(query)
	}

	async function refreshDashboard() {
		'use server'
		revalidatePath('/dashboard')
	}

	// --- Doctor Actions ---
	async function searchPatients(query: string) {
		'use server'
		const supabase = await createClient()
		const dal = new DataAccessLayer(supabase)
		return dal.searchPatient(query)
	}

	async function requestAccess(patientId: string) {
		'use server'
		const supabase = await createClient()
		const dal = new DataAccessLayer(supabase)
		await dal.requestConsent(user!.id, patientId)
		revalidatePath('/dashboard')
	}

	async function viewHistory(patientId: string) {
		'use server'
		redirect(`/dashboard/patient/${patientId}`)
	}

	async function doctorDeleteConsent(patientId: string) {
		'use server'
		const supabase = await createClient()
		const dal = new DataAccessLayer(supabase)
		await dal.deleteConsent(patientId, user!.id)
		revalidatePath('/dashboard')
	}

	const consents =
		profile.role === 'patient'
			? await dal.getConsentsForPatient(user.id)
			: await dal.getConsentsForDoctor(user.id)

	let history: any[] = []
	let tests: any[] = []

	if (profile.role === 'patient') {
		history = await dal.getPatientHistory(user.id)
		tests = await dal.getPatientTests(user.id)
	}

	return (
		<>
			{profile.role === 'patient' ? (
				<PatientDashboard
					profile={profile}
					consents={consents}
					history={history}
					tests={tests}
					signOut={signOut}
					approveConsent={approveConsent}
					revokeConsent={revokeConsent}
					deleteConsent={deleteConsent}
					searchDoctors={searchDoctors}
					refreshData={refreshDashboard}
				/>
			) : (
				<DoctorDashboard
					profile={profile}
					consents={consents}
					signOut={signOut}
					searchPatients={searchPatients}
					requestAccess={requestAccess}
					deleteConsent={doctorDeleteConsent}
					viewHistory={viewHistory}
				/>
			)}
		</>
	)
}
