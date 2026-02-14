interface MessageBubbleProps {
    role: 'user' | 'assistant'
    content: string
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === 'user'
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${isUser
                        ? 'bg-emerald-400 text-slate-900'
                        : 'bg-slate-900/80 text-slate-100'
                    }`}
            >
                {content}
            </div>
        </div>
    )
}
