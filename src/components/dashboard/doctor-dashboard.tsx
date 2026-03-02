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
import { ChatUI } from './chat-ui'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DoctorDashboardProps {
	profile: any
	consents: any[]
	queue: any[]
	upcoming: any[]
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
	const [isChatOpen, setIsChatOpen] = useState(false)

	useEffect(() => {
		// Listen for ANY changes to the appointment_queue for this doctor
		// This refreshes the whole dashboard, including the 'Upcoming' tab
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
		<div className="flex-1 w-full flex flex-row h-screen overflow-hidden relative">
			{/* Main Content Area */}
			<div className="flex-1 flex flex-col gap-8 p-4 md:p-8 overflow-y-auto">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl md:text-3xl font-bold">Doctor Portal: {profile.full_name}</h1>
					<div className="flex items-center gap-2">
						<Button 
							variant="outline" 
							size="icon" 
							className="md:hidden"
							onClick={() => setIsChatOpen(true)}
						>
							<MessageSquare className="w-5 h-5" />
						</Button>
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
													<p className="text-sm text-muted-foreground">
														{new Date(app.appointment_date).toLocaleDateString()} - Queue #{app.queue_number}
													</p>
												</div>
												<Badge variant="outline">Scheduled</Badge>
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

				{!isChatOpen && (
					<div className="hidden md:flex fixed bottom-8 right-8">
						<Button 
							size="lg" 
							className="rounded-full shadow-2xl gap-2 h-14 px-6"
							onClick={() => setIsChatOpen(true)}
						>
							<MessageSquare className="w-5 h-5" />
							AI Assistant
						</Button>
					</div>
				)}
			</div>

			{/* Collapsible Sidebar / Mobile Full-screen Overlay */}
			<aside className={cn(
				"transition-all duration-300 ease-in-out border-l bg-background flex flex-col shrink-0 z-50",
				"fixed inset-0 md:relative md:inset-auto", // Mobile full-screen, desktop relative
				isChatOpen ? "w-full md:w-80 lg:w-96 translate-x-0" : "w-0 translate-x-full md:translate-x-0 overflow-hidden border-l-0"
			)}>
				<div className="flex-1 flex flex-col p-6 min-w-[320px] md:min-w-0">
					<ChatUI 
						title="Doctor Assistant" 
						badge="Live"
						placeholder="Ask about your queue..."
						onClose={() => setIsChatOpen(false)}
						initialMessages={[
							{ 
								role: 'system', 
								content: 'You are a helpful medical assistant for a doctor. You can help them manage their queue and patient records.' 
						},
							{ 
								role: 'assistant', 
								content: `Hello Dr. ${profile.full_name.split(' ').pop()}! I'm your AI assistant. How can I help you manage your clinic today?` 
							}
						]}
					/>
				</div>
			</aside>
		</div>
	)
}
