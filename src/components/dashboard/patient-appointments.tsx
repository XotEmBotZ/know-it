'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Calendar,
	Users,
	X,
	Video,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface PatientAppointmentsProps {
	appointments: any[]
	onCancel?: (id: string) => Promise<any>
}

export function PatientAppointments({
	appointments,
	onCancel,
}: PatientAppointmentsProps) {
	const [mounted, setMounted] = useState(false)
	const safeAppointments = appointments || []
	const [queueAhead, setQueueAhead] = useState<Record<string, number>>({})
	const [cancelling, setCancelling] = useState<string | null>(null)
	const supabase = createClient()
	const router = useRouter()

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
		async function fetchDetails() {
			const doctorIds = [
				...new Set(safeAppointments.map((a) => a.doctor_id)),
			].filter(Boolean)
			if (doctorIds.length === 0) return

			// Fetch queue ahead for today's appointments
			const today = new Date().toISOString().split('T')[0]
			const todayApps = safeAppointments.filter(
				(a) => a.appointment_date === today,
			)

			const aheadMap: Record<string, number> = {}
			for (const app of todayApps) {
				const { count } = await supabase
					.from('appointment_queue')
					.select('*', { count: 'exact', head: true })
					.eq('doctor_id', app.doctor_id)
					.eq('appointment_date', today)
					.eq('status', 'pending')
					.lt('queue_number', app.queue_number)

				aheadMap[app.id] = count || 0
			}
			setQueueAhead(aheadMap)
		}

		fetchDetails()

		// Real-time subscription for queue changes
		const channel = supabase
			.channel('queue_changes')
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'appointment_queue',
				},
				() => {
					fetchDetails()
				},
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [appointments, supabase, safeAppointments])

	const handleCancel = async (id: string) => {
		if (!onCancel) return

		setCancelling(id)
		try {
			const res = await onCancel(id)
			if (res.success) {
				toast.success('Appointment cancelled')
				router.refresh()
			} else {
				toast.error(res.error || 'Failed to cancel appointment')
			}
		} catch (err) {
			toast.error('An error occurred')
		} finally {
			setCancelling(null)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>My Appointments</CardTitle>
			</CardHeader>
			<CardContent>
				{safeAppointments.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No upcoming appointments.
					</p>
				) : (
					<div className="flex flex-col gap-4">
						{safeAppointments.map((app) => {
							const aheadCount = queueAhead[app.id]
							const isToday =
								mounted &&
								new Date(app.appointment_date).toDateString() ===
									new Date().toDateString()
							const isVideo = app.appointment_type === 'video'
							const isEmergency = app.appointment_type === 'emergency'

							return (
								<div
									key={app.id}
									className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm bg-background"
								>
									<div className="flex justify-between items-start">
										<div>
											<div className="flex items-center gap-2">
												<p className="font-bold text-lg">
													{app.doctor?.full_name || 'Doctor'}
												</p>
												{isVideo && (
													<Badge
														variant="outline"
														className="flex gap-1 items-center bg-blue-50 text-blue-700 border-blue-200"
													>
														<Video className="w-3 h-3" />
														Video
													</Badge>
												)}
												{isEmergency && (
													<Badge
														variant="destructive"
														className="flex gap-1 items-center text-white bg-red-600"
													>
														Emergency
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Calendar className="w-3 h-3" />
												{formatDate(app.appointment_date)}
												<Badge variant="secondary" className="ml-2 font-mono">
													Queue #{app.queue_number}
												</Badge>
											</div>
										</div>
										<div className="flex items-center gap-2">
											{isToday && (
												<Badge
													variant="outline"
													className="border-green-500 text-green-600 animate-pulse"
												>
													Today
												</Badge>
											)}

											<AlertDialog>
												<AlertDialogTrigger
													render={
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-muted-foreground hover:text-destructive"
															disabled={cancelling === app.id}
														>
															<X className="h-4 w-4" />
														</Button>
													}
												/>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Cancel Appointment?
														</AlertDialogTitle>
														<AlertDialogDescription>
															Are you sure you want to cancel your appointment
															with Dr. {app.doctor?.full_name}? This will
															remove you from the queue.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															Keep Appointment
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleCancel(app.id)}
															className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														>
															Yes, Cancel
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</div>

									{isToday && typeof aheadCount === 'number' && (
										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between text-sm text-blue-600 bg-blue-50 p-2 rounded">
												<div className="flex items-center gap-2">
													<Users className="w-4 h-4" />
													<span>
														{aheadCount === 0
															? 'You are next in line!'
															: `${aheadCount} patient(s) ahead of you`}
													</span>
												</div>
											</div>
										</div>
									)}
								</div>
							)
						})}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
