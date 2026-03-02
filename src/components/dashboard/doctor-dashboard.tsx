'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DoctorConsents } from '@/components/doctor-consents'
import { DoctorPatientSearch } from '@/components/doctor-patient-search'
import { DoctorQueue } from './doctor-queue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DoctorDashboardProps {
	profile: any
	consents: any[]
	queue: any[]
	signOut: () => Promise<void>
	searchPatients: (query: string) => Promise<any[]>
	requestAccess: (patientId: string) => Promise<void>
	deleteConsent: (patientId: string) => Promise<void>
	viewHistory: (patientId: string) => Promise<void>
	markDone: (id: string) => Promise<any>
	skipPatient: (id: string) => Promise<any>
}

export function DoctorDashboard({
	profile,
	consents,
	queue,
	signOut,
	searchPatients,
	requestAccess,
	deleteConsent,
	viewHistory,
	markDone,
	skipPatient
}: DoctorDashboardProps) {
	const metadata = profile.metadata as any

	return (
		<div className="flex-1 w-full flex flex-col gap-8 p-8">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">
					Doctor Portal: {profile.full_name}
				</h1>
				<form action={signOut}>
					<Button type="submit" variant="outline">
						Sign Out
					</Button>
				</form>
			</div>

			<Tabs defaultValue="queue" className="w-full" id="doctor-dashboard-tabs">
				<TabsList className="grid w-full grid-cols-3 mb-8">
					<TabsTrigger value="queue" id="tab-trigger-queue">Active Queue</TabsTrigger>
					<TabsTrigger value="patients" id="tab-trigger-patients">My Patients</TabsTrigger>
					<TabsTrigger value="profile" id="tab-trigger-profile">Profile</TabsTrigger>
				</TabsList>

				<TabsContent value="queue" id="tab-content-queue">
					<DoctorQueue 
						queue={queue} 
						onMarkDone={markDone} 
						onSkip={skipPatient} 
					/>
				</TabsContent>

				<TabsContent value="patients" id="tab-content-patients">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<DoctorConsents
							consents={consents}
							onViewHistory={viewHistory}
							onDeleteConsent={deleteConsent}
						/>
						<DoctorPatientSearch
							initialResults={[]}
							onSearch={searchPatients}
							onRequestAccess={requestAccess}
							onDeleteConsent={deleteConsent}
							existingConsents={consents}
						/>
					</div>
				</TabsContent>

				<TabsContent value="profile" id="tab-content-profile">
					<Card>
						<CardHeader>
							<CardTitle>Professional Profile</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							<p>
								<span className="font-semibold">Role:</span>{' '}
								<span className="capitalize">{profile.role}</span>
							</p>
							<p>
								<span className="font-semibold">Medical ID:</span>{' '}
								{metadata?.medical_id}
							</p>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
