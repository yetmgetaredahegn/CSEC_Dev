import { useEffect, useState } from 'react'

import { apiFetchChatSessionDetail, apiFetchChatSessions } from '../api/client'

interface ChatSessionListItem {
  id: number
  created_at: string
  last_message?: { role: string; content: string; timestamp: string } | null
}

interface ChatSessionDetail {
  id: number
  created_at: string
  messages: Array<{ id: number; role: string; content: string; timestamp: string }>
}

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSessionListItem[]>([])
  const [selected, setSelected] = useState<ChatSessionDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSessions = async () => {
      setError('')
      try {
        const data = await apiFetchChatSessions()
        setSessions(data)
        if (data.length > 0) {
          const detail = await apiFetchChatSessionDetail(data[0].id)
          setSelected(detail)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
      }
    }

    loadSessions()
  }, [])

  const handleSelect = async (sessionId: number) => {
    setError('')
    try {
      const detail = await apiFetchChatSessionDetail(sessionId)
      setSelected(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl font-semibold text-white">Chat History</h1>
      <p className="mt-2 text-sm text-slate-400">Review and continue past conversations.</p>
      {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-200">Sessions</h2>
          <div className="mt-4 space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400">No sessions yet. Start chatting in the dashboard.</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSelect(session.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selected?.id === session.id
                      ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300'
                  }`}
                >
                  <p className="font-semibold">Session #{session.id}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(session.created_at).toLocaleString()}
                  </p>
                  {session.last_message ? (
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                      {session.last_message.content}
                    </p>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-sm font-semibold text-slate-200">Conversation</h2>
          <div className="mt-4 flex h-[420px] flex-col gap-3 overflow-y-auto rounded-2xl bg-slate-950/70 p-4">
            {selected?.messages?.length ? (
              selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'ml-auto bg-emerald-400 text-slate-900'
                      : 'bg-slate-900/80 text-slate-100'
                  }`}
                >
                  {msg.content}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Select a session to view messages.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
