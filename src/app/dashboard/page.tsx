import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DataAccessLayer } from '@/lib/dal'
import { PatientDashboard } from '@/components/dashboard/patient-dashboard'
import { DoctorDashboard } from '@/components/dashboard/doctor-dashboard'
import * as actions from './actions'

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

  // --- Data Fetching ---
  let consents: any[] = []
  let history: any[] = []
  let tests: any[] = []
  let queue: any[] = []
  let patientAppointments: any[] = []

  try {
    consents = profile.role === 'patient' 
      ? await dal.getConsentsForPatient(user.id)
      : await dal.getConsentsForDoctor(user.id)

    if (profile.role === 'patient') {
      history = await dal.getPatientHistory(user.id)
      tests = await dal.getPatientTests(user.id)
      patientAppointments = await dal.getPatientAppointments(user.id)
    } else {
      queue = await dal.getDoctorActiveQueue(user.id)
    }
  } catch (error) {
    console.error('DashboardPage: Failed to fetch dashboard data', error)
  }

	return (
		<>
			{profile.role === 'patient' ? (
				<PatientDashboard
					profile={profile}
					consents={consents}
					history={history}
					tests={tests}
          appointments={patientAppointments}
					signOut={actions.signOut}
					approveConsent={actions.approveConsent}
					revokeConsent={actions.revokeConsent}
					deleteConsent={actions.deleteConsent}
					searchDoctors={actions.searchDoctors}
          bookAppointment={actions.bookAppointment}
				/>
			) : (
				<DoctorDashboard
					profile={profile}
					consents={consents}
          queue={queue}
					signOut={actions.signOut}
					searchPatients={actions.searchPatients}
					requestAccess={actions.requestAccess}
					deleteConsent={actions.doctorDeleteConsent}
					viewHistory={actions.viewHistory}
          markDone={actions.markDone}
          skipPatient={actions.skipPatient}
				/>
			)}
		</>
	)
}
