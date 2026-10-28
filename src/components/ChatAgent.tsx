'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Check, Copy, History, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getGeminiApiKey } from '@/lib/ai-service'
import Modal from '@/components/ui/Modal'
import Thinking from '@/components/ui/Thinking'

interface Message {
  role: 'user' | 'assistant'
  content: string
  /** How long the reply took, in seconds. */
  took?: number
}

const SUGGESTED_QUESTIONS = [
  'Which of my scans is the healthiest?',
  'Which ones are vegan?',
  'What should I swap first?',
  'Which are highest in protein?',
]

const MAX_COMPOSER_HEIGHT = 132
// Words and the spaces between them both count as tokens here.
const TOKENS_PER_TICK = 4
const TICK_MS = 28

/**
 * Nourish AI: questions answered from the person's own scan history. Opens as a
 * sheet so it never fights the tab bar for the bottom of a phone screen.
 * Reply patterns (timed headers, streamed text, actions, follow-ups) follow
 * Beautiful UI's AI primitives, drawn in Nourish's soft clay.
 */
export default function ChatAgent({ context, open, onClose }: { context?: any; open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Index of the reply still streaming in, if any.
  const [streaming, setStreaming] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const productCount: number = Array.isArray(context?.products) ? context.products.length : 0
  const busy = loading || streaming !== null

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

  /** Send `text` after `history`; retries pass the thread as it stood before. */
  const send = async (text: string, history: Message[] = messages) => {
    if (!text.trim() || busy) return
    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      toast.error('Add your Gemini key in Settings to chat with Nourish AI.')
      return
    }

    const userMessage: Message = { role: 'user', content: text.trim() }
    const thread = [...history, userMessage]
    setMessages(thread)
    setInput('')
    setLoading(true)
    const started = performance.now()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-api-key': apiKey },
        body: JSON.stringify({ messages: thread.map(({ role, content }) => ({ role, content })), context }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'That message did not go through. Try again.')
      const took = (performance.now() - started) / 1000
      setMessages((prev) => [...prev, { role: 'assistant', content: data.choices[0].message.content, took }])
      setStreaming(thread.length)
    } catch (error: any) {
      toast.error(typeof error?.message === 'string' ? error.message : 'That message did not go through. Try again.')
      setMessages(history)
      setInput(text)
    } finally {
      setLoading(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const asked = new Set(messages.filter((m) => m.role === 'user').map((m) => m.content))
  const followUps = SUGGESTED_QUESTIONS.filter((q) => !asked.has(q)).slice(0, 2)
  const lastIndex = messages.length - 1

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      label="Nourish AI"
      size="lg"
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="rounded-[14px] border border-line bg-paper p-1.5 shadow-neu-inset transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong/40 focus-within:shadow-neu-inset-deep"
        >
          <label htmlFor="chat-input" className="sr-only">
            Message Nourish AI
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
            placeholder="Ask Nourish AI about your scans…"
            className="block max-h-[132px] w-full resize-none bg-transparent px-2 pb-1 pt-1.5 text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere] placeholder:text-ink-3 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 pl-1 pt-1">
            <span className="chip">
              <History className="h-3 w-3" aria-hidden="true" />
              {productCount} product{productCount === 1 ? '' : 's'} from your history
            </span>
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent text-on-accent shadow-neu-sm transition-[background-color,color,opacity,transform] duration-200 enabled:active:scale-[0.94] disabled:bg-surface-3 disabled:text-ink-3 disabled:shadow-none"
            >
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      }
    >
      <div className="min-h-[40dvh]">
        {messages.length === 0 ? (
          <div className="chat-in pt-2">
            <div>
              <p className="font-display text-lg font-bold tracking-tight">Hi, I&rsquo;m Nourish AI.</p>
              <p className="text-sm text-ink-2">
                I&rsquo;ve read your {productCount} scan{productCount === 1 ? '' : 's'}. Ask me anything about them.
              </p>
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <li key={q} className="chat-in" style={{ animationDelay: `${80 + i * 50}ms` }}>
                  <button type="button" onClick={() => send(q)} className="tile w-full px-4 py-3.5 text-left text-sm">
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div aria-live="polite" className="space-y-5 pt-1">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="chat-in flex justify-end pl-14">
                  <p className="whitespace-pre-wrap rounded-xl bg-surface-2 px-3.5 py-2 text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere]">
                    {m.content}
                  </p>
                </div>
              ) : (
                <Reply
                  key={i}
                  message={m}
                  productCount={productCount}
                  streaming={streaming === i}
                  onStreamed={() => setStreaming((s) => (s === i ? null : s))}
                  onRetry={
                    i === lastIndex && !busy && messages[i - 1]
                      ? () => send(messages[i - 1].content, messages.slice(0, i - 1))
                      : undefined
                  }
                />
              )
            )}
            {loading && (
              <div className="chat-in">
                <Thinking label={`Reading ${productCount} product${productCount === 1 ? '' : 's'}`} className="text-ink-2" />
              </div>
            )}
            {!busy && messages[lastIndex]?.role === 'assistant' && followUps.length > 0 && (
              <div className="chat-in space-y-1.5 border-t border-line pt-4">
                <p className="text-xs font-medium text-ink-3">Ask next</p>
                {followUps.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="-mx-2 flex min-h-9 w-[calc(100%+1rem)] items-center rounded-lg px-2 text-left text-sm text-ink-2 transition-colors duration-100 hover:bg-surface-2 hover:text-ink"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </Modal>
  )
}

function Reply({
  message,
  productCount,
  streaming,
  onStreamed,
  onRetry,
}: {
  message: Message
  productCount: number
  streaming: boolean
  onStreamed: () => void
  onRetry?: () => void
}) {
  const words = message.content.split(/(\s+)/)
  const [shown, setShown] = useState(streaming ? 0 : words.length)
  const [copied, setCopied] = useState(false)
  const done = shown >= words.length

  useEffect(() => {
    if (!streaming) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(words.length)
      return
    }
    const id = window.setInterval(() => setShown((n) => n + TOKENS_PER_TICK), TICK_MS)
    return () => window.clearInterval(id)
    // Stream once, when the reply arrives.
  }, [streaming])

  useEffect(() => {
    if (streaming && done) onStreamed()
  }, [streaming, done, onStreamed])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy that reply.')
    }
  }

  return (
    <div className="chat-in">
      <div className="min-w-0 max-w-[92%]">
        <p className="flex items-center gap-1 text-xs leading-5">
          <span className="font-semibold text-ink">Nourish AI</span>
          <span className="text-ink-3">read {productCount} scan{productCount === 1 ? '' : 's'}</span>
          {message.took !== undefined && <span className="tnum text-ink-2">for {message.took.toFixed(1)}s</span>}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink [overflow-wrap:anywhere]">
          {words.slice(0, shown).join('')}
          {!done && <span aria-hidden="true" className="stream-caret" />}
        </p>
        <div
          className={`mt-1.5 flex items-center gap-0.5 transition-opacity duration-300 ${done ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          <ReplyAction label={copied ? 'Copied' : 'Copy reply'} onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          </ReplyAction>
          {onRetry && (
            <ReplyAction label="Ask again" onClick={onRetry}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </ReplyAction>
          )}
        </div>
      </div>
    </div>
  )
}

function ReplyAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 transition-[background-color,color,transform] duration-100 hover:bg-surface-2 hover:text-ink-2 active:scale-[0.94]"
    >
      {children}
    </button>
  )
}
