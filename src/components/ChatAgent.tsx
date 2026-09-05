'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, ArrowUp, Loader2, Bot } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface ChatAgentProps {
    context?: any
}

const SUGGESTED_QUESTIONS = [
    "Which of my scans is the healthiest?",
    "Which ones are suitable for vegans?",
    "Show me the ones highest in protein",
    "Which has the smallest footprint?",
]

// The composer grows with what you type, up to five lines, then scrolls.
const MAX_COMPOSER_HEIGHT = 132

export default function ChatAgent({ context }: ChatAgentProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    /** Match the composer's height to its content. */
    const autosize = useCallback(() => {
        const el = inputRef.current
        if (!el) return
        // Reset first so the box can shrink again when text is deleted.
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`
        el.style.overflowY = el.scrollHeight > MAX_COMPOSER_HEIGHT ? 'auto' : 'hidden'
    }, [])

    useEffect(autosize, [input, autosize])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (isOpen) inputRef.current?.focus()
    }, [isOpen])

    // Escape closes the panel, like every other overlay in the product.
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen])

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || loading) return

        const userMessage: Message = { role: 'user', content: messageText }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    context,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to get response')
            }

            const data = await response.json()
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.choices[0].message.content,
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (error: any) {
            console.error('Chat error:', error)
            toast.error(error.message || 'That message did not go through. Try again.')
            // Drop the user message again so the thread matches what was sent.
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    // Enter sends. Shift and Enter starts a new line.
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    const canSend = Boolean(input.trim()) && !loading

    return (
        <>
            {/* Launcher */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        type="button"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        aria-label="Open the assistant"
                        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white text-black shadow-2xl shadow-black/50 transition-transform hover:scale-105 active:scale-95"
                    >
                        <MessageCircle className="h-6 w-6" aria-hidden="true" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        role="dialog"
                        aria-label="Assistant"
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[calc(100dvh-3rem)] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-zinc-900 to-black shadow-2xl shadow-black/70"
                    >
                        {/* A hairline of light across the head, as on the dialogs. */}
                        <span
                            aria-hidden="true"
                            className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                        />

                        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                                    <Bot className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="font-display text-sm font-semibold tracking-tight">Assistant</h2>
                                    <p className="text-xs text-zinc-500">Knows everything you have scanned</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close the assistant"
                                className="btn-icon -mr-1"
                            >
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        {/* Thread */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-4">
                            {messages.length === 0 ? (
                                <div className="py-6 text-center">
                                    <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                        <Bot className="h-6 w-6" aria-hidden="true" />
                                    </span>
                                    <h3 className="font-display text-base font-semibold tracking-tight">
                                        Ask about your scans
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-zinc-400">
                                        It has read your whole history, so the answer is about your food, not food
                                        in general.
                                    </p>

                                    <p className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-label text-zinc-600">
                                        Try asking
                                    </p>
                                    <ul className="m-0 list-none space-y-2 text-left">
                                        {SUGGESTED_QUESTIONS.map((question) => (
                                            <li key={question}>
                                                <button
                                                    type="button"
                                                    onClick={() => sendMessage(question)}
                                                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-sm text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                                                >
                                                    {question}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div aria-live="polite" className="space-y-4">
                                    {messages.map((message, i) => (
                                        <div
                                            key={i}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {/* Bubbles hug their text and stop at 85%. */}
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                                                    message.role === 'user'
                                                        ? 'bg-white text-black'
                                                        : 'border border-white/10 bg-white/[0.06] text-zinc-100'
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
                                                    {message.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                                <span className="sr-only">Thinking</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Composer: one line to start, growing with the text. */}
                        <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
                            <div className="flex items-end gap-2 rounded-2xl border border-white/12 bg-white/[0.04] p-2 transition-colors focus-within:border-white/40">
                                <label htmlFor="chat-input" className="sr-only">
                                    Ask about your scans
                                </label>
                                <textarea
                                    id="chat-input"
                                    ref={inputRef}
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a question"
                                    disabled={loading}
                                    className="max-h-[132px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!canSend}
                                    aria-label="Send"
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity hover:opacity-90 disabled:opacity-30"
                                >
                                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
