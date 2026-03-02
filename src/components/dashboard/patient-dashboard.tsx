'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { PatientConsents } from '@/components/patient-consents'
import { ChatUI, Message } from './chat-ui'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatAction } from '@/app/actions/chat-actions'
import { SharePrescriptionDialog } from './share-prescription-dialog'

interface PatientDashboardProps {
	profile: any
	consents: any[]
	history: any[]
	tests: any[]
	signOut: () => Promise<void>
	approveConsent: (doctorId: string) => Promise<void>
	revokeConsent: (doctorId: string) => Promise<void>
	deleteConsent: (doctorId: string) => Promise<void>
	searchDoctors: (query: string) => Promise<any[]>
}

export function PatientDashboard({
	profile,
	consents,
	history,
	tests,
	signOut,
	approveConsent,
	revokeConsent,
	deleteConsent,
	searchDoctors,
}: PatientDashboardProps) {
	const metadata = profile.metadata as any
	const [isChatOpen, setIsChatOpen] = useState(false)
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'system',
			content:
				'You are a helpful medical assistant for a patient. You have access to their medical records and test results.',
		},
		{
			role: 'assistant',
			content: `Hello ${profile.full_name}! I'm your AI health assistant. How can I help you today?`,
		},
	])

	const handleSendMessage = async (query: string) => {
		const res = await chatAction(
			profile.id,
			profile.full_name,
			query,
			messages,
			'patient',
		)
		setMessages((prev) => [
			...prev,
			{ role: 'user', content: query },
			{ role: 'assistant', content: res },
		])
		return res
	}

	return (
		<div className="flex-1 w-full flex flex-row h-screen overflow-hidden relative">
			{/* Main Content Area */}
			<div className="flex-1 flex flex-col gap-8 p-4 md:p-8 overflow-y-auto">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl md:text-3xl font-bold">
						Welcome, {profile.full_name}
					</h1>
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
							<Button type="submit" variant="outline">
								Sign Out
							</Button>
						</form>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Profile Info</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							<p>
								<span className="font-semibold">Role:</span>{' '}
								<span className="capitalize">{profile.role}</span>
							</p>
							<p>
								<span className="font-semibold">DOB:</span> {metadata?.dob}
							</p>
							<p>
								<span className="font-semibold">Blood Group:</span>{' '}
								{metadata?.blood_group}
							</p>
						</CardContent>
					</Card>

					<PatientConsents
						initialConsents={consents}
						onApprove={approveConsent}
						onRevoke={revokeConsent}
						onDelete={deleteConsent}
						onSearchDoctors={searchDoctors}
						onGrantAccess={approveConsent}
					/>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Medical History</CardTitle>
						</CardHeader>
						<CardContent>
							{history && history.length > 0 ? (
								<div className="flex flex-col gap-4">
									{history.map((record) => (
										<div
											key={record.id}
											className="p-4 border rounded-lg flex flex-col gap-2"
										>
											<div className="flex justify-between items-start">
												<div>
													<p className="font-semibold">
														{record.doctor?.full_name || 'Doctor'}
													</p>
													<p className="text-sm text-muted-foreground">
														{new Date(record.date).toLocaleDateString()}
													</p>
												</div>
												<SharePrescriptionDialog medicalRecordId={record.id} />
											</div>
											<p className="text-sm">
												<span className="font-medium">
													Symptoms and Diagnosis:
												</span>{' '}
												{record.symptoms}
											</p>
											<p className="text-sm">
												<span className="font-medium">
													Prescriptions and Remedies:
												</span>{' '}
												{record.solutions}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									No medical history found.
								</p>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Test Results</CardTitle>
						</CardHeader>
						<CardContent>
							{tests && tests.length > 0 ? (
								<div className="flex flex-col gap-4">
									{tests.map((test) => (
										<div
											key={test.id}
											className="p-4 border rounded-lg flex flex-col gap-2"
										>
											<div className="flex justify-between items-start">
												<p className="font-semibold">{test.test_name}</p>
												<p className="text-sm text-muted-foreground">
													{new Date(test.date).toLocaleDateString()}
												</p>
											</div>
											<p className="text-sm">
												<span className="font-medium">Results:</span>{' '}
												{test.results}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									No test results found.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

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
			<aside
				className={cn(
					'transition-all duration-300 ease-in-out border-l bg-background flex flex-col shrink-0 z-50',
					'fixed inset-0 md:relative md:inset-auto', // Mobile full-screen, desktop relative
					isChatOpen
						? 'w-full md:w-80 lg:w-96 translate-x-0'
						: 'w-0 translate-x-full md:translate-x-0 overflow-hidden border-l-0',
				)}
			>
				<div className="flex-1 flex flex-col p-6 min-w-[320px] md:min-w-0">
					<ChatUI
						title="Health Assistant"
						badge="Live"
						placeholder="Ask about your records..."
						onClose={() => setIsChatOpen(false)}
						onSendMessage={handleSendMessage}
						initialMessages={messages}
					/>
				</div>
			</aside>
		</div>
	)
}
