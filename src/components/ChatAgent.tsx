'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react'
import Button from './ui/Button'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface ChatAgentProps {
    context?: any
}

const SUGGESTED_QUESTIONS = [
    "What are the healthiest products I've scanned?",
    "Which products are vegan-friendly?",
    "Show me products with high protein",
    "What products have the best eco-impact scores?",
]

export default function ChatAgent({ context }: ChatAgentProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
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
            toast.error(error.message || 'Failed to send message')
            // Remove the user message if there was an error
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input)
    }

    const handleSuggestedQuestion = (question: string) => {
        sendMessage(question)
    }

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
                    >
                        <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-dark"></span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-dark-card rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">AI Assistant</h3>
                                    <p className="text-xs text-zinc-400">Ask about your scans</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Bot className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <h4 className="font-semibold text-white mb-2">Ask me anything!</h4>
                                    <p className="text-sm text-zinc-400 mb-6">I can help you understand your scanned products</p>

                                    {/* Suggested Questions */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Try asking:</p>
                                        {SUGGESTED_QUESTIONS.map((question, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSuggestedQuestion(question)}
                                                className="block w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-zinc-300 transition-colors border border-white/10 hover:border-purple-500/30"
                                            >
                                                {question}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message, i) => (
                                        <div
                                            key={i}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                                                    : 'bg-white/10 text-zinc-100 border border-white/10'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
                                                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 bg-dark-elevated">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-white/5 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="px-4 py-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
