import { useEffect, useMemo, useRef, useState } from 'react'

import { getWebSocketUrl, tokenStore } from '../api/client'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [sessionId, setSessionId] = useState<number | null>(null)
    const [status, setStatus] = useState('')
    const socketRef = useRef<WebSocket | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    const wsUrl = useMemo(() => {
        const token = tokenStore.getAccessToken()
        const url = new URL(getWebSocketUrl('/ws/chat/'))
        if (token) {
            url.searchParams.set('token', token)
        }
        return url.toString()
    }, [])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        if (
            socketRef.current &&
            (socketRef.current.readyState === WebSocket.OPEN ||
                socketRef.current.readyState === WebSocket.CONNECTING)
        ) {
            return
        }

        const socket = new WebSocket(wsUrl)
        socketRef.current = socket

        socket.onopen = () => {
            setStatus('connected')
        }

        socket.onclose = () => {
            setStatus('disconnected')
            setIsStreaming(false)
            socketRef.current = null
        }

        socket.onerror = () => {
            setStatus('error')
            setIsStreaming(false)
        }

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data)
                if (payload.type === 'session') {
                    setSessionId(payload.session_id)
                    return
                }
                if (payload.type === 'delta') {
                    setMessages((prev) => {
                        const next = [...prev]
                        const last = next[next.length - 1]
                        if (!last || last.role !== 'assistant') {
                            next.push({ role: 'assistant', content: payload.content })
                        } else {
                            last.content += payload.content
                        }
                        return next
                    })
                    return
                }
                if (payload.type === 'done') {
                    setIsStreaming(false)
                    return
                }
                if (payload.type === 'error') {
                    setIsStreaming(false)
                    setStatus(payload.error)
                }
            } catch {
                setStatus('invalid_message')
            }
        }

        return () => {
            socket.close()
        }
    }, [isOpen, wsUrl])

    useEffect(() => {
        if (!scrollRef.current) {
            return
        }
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages, isStreaming])

    const handleSend = () => {
        if (!input.trim() || isStreaming) {
            return
        }

        const socket = socketRef.current
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            setStatus('not_connected')
            return
        }

        const message = input.trim()
        setInput('')
        setMessages((prev) => [...prev, { role: 'user', content: message }])
        setIsStreaming(true)

        socket.send(
            JSON.stringify({
                message,
                session_id: sessionId,
            }),
        )
    }

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-lg font-semibold text-slate-900 shadow-xl"
            >
                {isOpen ? '×' : 'AI'}
            </button>

            <div
                className={`mt-4 w-[340px] origin-bottom-right rounded-3xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur transition duration-300 ${isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-white">CSEC Live Assistant</p>
                        <p className="text-xs text-slate-400">{status || 'ready'}</p>
                    </div>
                    <span className="rounded-full border border-emerald-400/50 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                        RAG
                    </span>
                </div>

                <div
                    ref={scrollRef}
                    className="mt-4 flex h-64 flex-col gap-3 overflow-y-auto rounded-2xl bg-slate-900/60 p-3"
                >
                    {messages.length === 0 ? (
                        <p className="text-xs text-slate-400">
                            Ask about your services, onboarding, or upload guidance.
                        </p>
                    ) : (
                        messages.map((msg, index) => <MessageBubble key={index} {...msg} />)
                    )}
                    {isStreaming ? <TypingIndicator /> : null}
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleSend()
                            }
                        }}
                        placeholder="Ask me anything..."
                        className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600"
                    />
                    <button
                        onClick={handleSend}
                        className="rounded-2xl bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    )
}
