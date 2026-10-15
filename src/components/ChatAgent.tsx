'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, History } from 'lucide-react'
import { toast } from 'sonner'
import { getGeminiApiKey } from '@/lib/ai-service'
import Modal from '@/components/ui/Modal'
import Thinking from '@/components/ui/Thinking'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'Which of my scans is the healthiest?',
  'Which ones are vegan?',
  'What should I swap first?',
  'Which are highest in protein?',
]

const MAX_COMPOSER_HEIGHT = 132

/**
 * Aisle: questions answered from the person's own scan history. Opens as a
 * sheet so it never fights the tab bar for the bottom of a phone screen.
 */
export default function ChatAgent({ context, open, onClose }: { context?: any; open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const productCount: number = Array.isArray(context?.products) ? context.products.length : 0

  const autosize = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`
    el.style.overflowY = el.scrollHeight > MAX_COMPOSER_HEIGHT ? 'auto' : 'hidden'
  }, [])

  useEffect(autosize, [input, autosize])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      toast.error('Add your Gemini key in Settings to use Aisle.')
      return
    }

    const userMessage: Message = { role: 'user', content: text.trim() }
    const thread = [...messages, userMessage]
    setMessages(thread)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
        body: JSON.stringify({ messages: thread, context }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'That message did not go through. Try again.')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.choices[0].message.content }])
    } catch (error: any) {
      toast.error(typeof error?.message === 'string' ? error.message : 'That message did not go through. Try again.')
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setLoading(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Ask Aisle"
      description="Answers come from your own scan history."
      size="lg"
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="rounded-2xl bg-paper shadow-neu-inset transition-[box-shadow] duration-300 focus-within:shadow-neu-inset-deep focus-within:ring-2 focus-within:ring-ink/40 focus-within:ring-offset-2 focus-within:ring-offset-paper"
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask about your scans
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder="Ask about your scans"
            className="block max-h-[132px] w-full resize-none bg-transparent px-3.5 pb-1 pt-3 text-[0.9375rem] leading-relaxed placeholder:text-ink-3 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 p-2 pl-3">
            <span className="chip">
              <History className="h-3 w-3" aria-hidden="true" />
              {productCount} product{productCount === 1 ? '' : 's'} from your history
            </span>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent shadow-neu-sm transition-[opacity,box-shadow] active:shadow-neu-press-color disabled:opacity-30 disabled:shadow-none"
            >
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      }
    >
      <div className="min-h-[40dvh]">
        {messages.length === 0 ? (
          <div className="pt-2">
            <p className="text-sm text-ink-2">Try one of these, or ask your own.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => send(q)}
                    className="tile w-full px-4 py-3.5 text-left text-sm"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div aria-live="polite" className="space-y-5 pt-1">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user' ? (
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-paper px-4 py-2.5 text-[0.9375rem] shadow-neu-sm leading-relaxed [overflow-wrap:anywhere]">
                    {m.content}
                  </p>
                ) : (
                  <div className="max-w-[92%]">
                    <p className="mb-1 text-xs font-semibold text-ink-3">Aisle</p>
                    <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere]">{m.content}</p>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <Thinking label={`Reading ${productCount} product${productCount === 1 ? '' : 's'}`} className="text-ink-2" />
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </Modal>
  )
}
