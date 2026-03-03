'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DoctorConsents } from '@/components/doctor-consents'
import { DoctorPatientSearch } from '@/components/doctor-patient-search'
import { Badge } from '@/components/ui/badge'
import { DoctorQueue } from './doctor-queue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { SemanticCaseSearch } from './semantic-case-search'

interface DoctorDashboardProps {
	profile: any
	consents: any[]
	queue: any[]
	upcoming: any[]
	signOut: () => Promise<void>
	searchPatients: (query: string) => Promise<any[]>
	requestAccess: (patientId: string) => Promise<any>
	deleteConsent: (patientId: string) => Promise<any>
	viewHistory: (patientId: string) => Promise<any>
	markDone: (id: string) => Promise<any>
	skipPatient: (id: string) => Promise<any>
}

export function DoctorDashboard({
	profile,
	consents,
	queue,
	upcoming,
	signOut,
	searchPatients,
	requestAccess,
	deleteConsent,
	viewHistory,
	markDone,
	skipPatient
}: DoctorDashboardProps) {
	const metadata = profile.metadata as any
	const router = useRouter()
	const supabase = createClient()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const formatDate = (dateStr: string) => {
		if (!mounted) return ''
		try {
			return new Date(dateStr).toLocaleDateString()
		} catch (e) {
			return dateStr
		}
	}

	useEffect(() => {
		const channel = supabase
			.channel('doctor_global_queue_changes')
			.on('postgres_changes', { 
				event: '*', 
				schema: 'public', 
				table: 'appointment_queue' 
			}, () => {
				router.refresh()
			})
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [supabase, router])

	return (
		<div className="flex-1 w-full flex flex-col min-h-screen">
			<div className="flex-1 flex flex-col gap-8 p-4 md:p-8">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl md:text-3xl font-bold">Doctor Portal: {profile.full_name}</h1>
					<div className="flex items-center gap-2">
						<form action={signOut}>
							<Button type="submit" variant="outline">Sign Out</Button>
						</form>
					</div>
				</div>

				<Tabs defaultValue="queue" className="w-full" id="doctor-dashboard-tabs">
					<TabsList className="grid w-full grid-cols-4 mb-8">
						<TabsTrigger value="queue" id="tab-trigger-queue">Active Queue</TabsTrigger>
						<TabsTrigger value="upcoming" id="tab-trigger-upcoming">Upcoming</TabsTrigger>
						<TabsTrigger value="patients" id="tab-trigger-patients">My Patients</TabsTrigger>
						<TabsTrigger value="profile" id="tab-trigger-profile">Profile</TabsTrigger>
					</TabsList>

					<TabsContent value="queue" id="tab-content-queue">
						<DoctorQueue 
							queue={queue} 
							onMarkDone={markDone} 
							onSkip={skipPatient} 
							onViewHistory={viewHistory}
						/>
					</TabsContent>

					<TabsContent value="upcoming" id="tab-content-upcoming">
						<Card>
							<CardHeader>
								<CardTitle>Upcoming Appointments</CardTitle>
							</CardHeader>
							<CardContent>
								{upcoming && upcoming.length > 0 ? (
									<div className="flex flex-col gap-4">
										{upcoming.map((app) => (
											<div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
												<div>
													<p className="font-semibold">{app.patient?.full_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(app.appointment_date)} - Queue #{app.queue_number}
                            </p>
                            {app.appointment_type === 'video' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Video</Badge>
                            )}
                            {app.appointment_type === 'emergency' && (
                              <Badge variant="destructive" className="text-[10px] bg-red-600">Emergency</Badge>
                            )}
                          </div>
												</div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewHistory(app.patient_id)}>History</Button>
												  <Badge variant="outline">Scheduled</Badge>
                        </div>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground text-center py-8">No upcoming appointments beyond today.</p>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="patients" id="tab-content-patients">
						<div className="flex flex-col gap-6">
							<SemanticCaseSearch />
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
		</div>
	)
}
