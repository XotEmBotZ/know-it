'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export interface Message {
	role: 'assistant' | 'user' | 'system'
	content: string
}

interface ChatUIProps {
	title?: string
	initialMessages?: Message[]
	placeholder?: string
	onSendMessage?: (message: string) => Promise<string>
	onClose?: () => void
	className?: string
	badge?: string
}

export function ChatUI({
	title = 'AI Assistant',
	initialMessages = [],
	placeholder = 'Ask a question...',
	onSendMessage,
	onClose,
	className,
	badge,
}: ChatUIProps) {
	const [messages, setMessages] = useState<Message[]>(initialMessages)
	const [input, setInput] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const scrollRef = useRef<HTMLDivElement>(null)

	// Auto-scroll to bottom
	useEffect(() => {
		const scrollContainer = scrollRef.current?.querySelector(
			'[data-radix-scroll-area-viewport]',
		)
		if (scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight
		}
	}, [messages, isLoading])

	const handleSend = async (e?: React.FormEvent) => {
		e?.preventDefault()
		if (!input.trim() || isLoading) return

		const userMessage = input.trim()
		setInput('')
		setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
		setIsLoading(true)

		try {
			if (onSendMessage) {
				const response = await onSendMessage(userMessage)
				setMessages((prev) => [
					...prev,
					{ role: 'assistant', content: response },
				])
			} else {
				// Default mock response if no handler provided
				await new Promise((resolve) => setTimeout(resolve, 1000))
				setMessages((prev) => [
					...prev,
					{
						role: 'assistant',
						content:
							"I'm currently in prototype mode. Once connected to the backend, I'll be able to analyze medical records and provide personalized insights.",
					},
				])
			}
		} catch (error) {
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: 'Sorry, I encountered an error processing your request.',
				},
			])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card
			className={cn(
				'flex flex-col h-full border-none shadow-none bg-transparent p-0',
				className,
			)}
		>
			<CardHeader className="py-4 px-0 flex flex-row items-center justify-between shrink-0">
				<div className="flex items-center gap-2">
					<div className="bg-primary/10 p-2 rounded-lg">
						<Bot className="w-5 h-5 text-primary" />
					</div>
					<CardTitle className="text-xl font-bold tracking-tight">
						{title}
					</CardTitle>
					{badge && (
						<div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium ml-2">
							<Sparkles className="w-3 h-3" />
							{badge}
						</div>
					)}
				</div>
				{onClose && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="rounded-full"
					>
						<X className="w-5 h-5" />
					</Button>
				)}
			</CardHeader>

			<CardContent className="flex-1 overflow-hidden p-0 relative min-h-0">
				<ScrollArea className="h-full w-full" ref={scrollRef}>
					<div className="flex flex-col gap-6 py-4">
						{messages
							.filter((m) => m.role !== 'system')
							.map((message, index) => (
								<div
									key={index}
									className={cn(
										'flex items-start gap-3',
										message.role === 'user' ? 'flex-row-reverse' : '',
									)}
								>
									<Avatar
										className={cn(
											'w-8 h-8 shrink-0',
											message.role === 'assistant'
												? 'border bg-background'
												: 'bg-primary text-primary-foreground',
										)}
									>
										<AvatarFallback className="text-[10px]">
											{message.role === 'assistant' ? (
												<Bot className="w-4 h-4" />
											) : (
												<User className="w-4 h-4" />
											)}
										</AvatarFallback>
									</Avatar>
									<div
										className={cn(
											'px-4 py-3 rounded-2xl text-sm shadow-sm max-w-[85%] overflow-hidden',
											message.role === 'assistant'
												? 'bg-card border text-card-foreground rounded-tl-none'
												: 'bg-primary text-primary-foreground rounded-tr-none',
										)}
									>
										<div
											className={cn(
												'prose prose-sm max-w-none break-words',
												message.role === 'assistant'
													? 'dark:prose-invert'
													: 'prose-invert',
												'[&>p:not(:last-child)]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2 [&>li]:mb-1 [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2 [&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mb-1 [&>code]:bg-muted [&>code]:px-1 [&>code]:rounded-sm [&>code]:text-[0.8rem] [&>pre]:bg-muted [&>pre]:p-2 [&>pre]:rounded-md [&>pre]:my-2 [&>pre]:overflow-x-auto [&>table]:border-collapse [&>table]:w-full [&>table]:my-2 [&>table_th]:border [&>table_th]:p-1 [&>table_th]:bg-muted [&>table_td]:border [&>table_td]:p-1',
											)}
										>
											<ReactMarkdown remarkPlugins={[remarkGfm]}>
												{message.content}
											</ReactMarkdown>
										</div>
									</div>
								</div>
							))}
						{isLoading && (
							<div className="flex items-start gap-3">
								<Avatar className="w-8 h-8 border bg-background shrink-0">
									<AvatarFallback>
										<Bot className="w-4 h-4" />
									</AvatarFallback>
								</Avatar>
								<div className="bg-card border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
									<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
								</div>
							</div>
						)}
					</div>
				</ScrollArea>
			</CardContent>

			<CardFooter className="p-0 pt-4 shrink-0">
				<form onSubmit={handleSend} className="relative w-full group">
					<Input
						placeholder={placeholder}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						disabled={isLoading}
						className="pr-12 py-6 rounded-2xl bg-card border-muted-foreground/20 focus-visible:ring-primary transition-all shadow-sm"
					/>
					<Button
						size="icon"
						type="submit"
						disabled={isLoading || !input.trim()}
						className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl transition-all"
					>
						<Send className="w-4 h-4" />
					</Button>
				</form>
			</CardFooter>
		</Card>
	)
}
