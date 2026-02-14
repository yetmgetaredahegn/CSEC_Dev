import { Link } from 'react-router-dom'

import ChatWidget from '../components/ChatWidget'

export default function DashboardPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">CSEC AI</p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-white">
              A living knowledge base for your product, powered by real-time AI.
            </h1>
            <p className="mt-6 text-base text-slate-300">
              Upload your docs, let the chatbot answer instantly, and keep every conversation in sync
              with your latest updates.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/admin"
                className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900"
              >
                Manage Knowledge Base
              </Link>
              <Link
                to="/chat-history"
                className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100"
              >
                View Chat History
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Live Chat Preview</h2>
              <span className="text-xs text-emerald-300">Streaming</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-950/80 p-4 text-sm text-slate-200">
                How do I onboard my team?
              </div>
              <div className="rounded-2xl bg-emerald-400/20 p-4 text-sm text-emerald-100">
                Invite teammates from the admin panel and they will get secure access immediately.
              </div>
            </div>
            <button className="mt-8 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-900">
              Open Chat Widget
            </button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -top-48 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
      <ChatWidget />
    </div>
  )
}
