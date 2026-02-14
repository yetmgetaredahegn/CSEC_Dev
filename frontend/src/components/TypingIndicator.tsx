export default function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 [animation-delay:300ms]" />
            <span className="ml-2">Assistant is typing</span>
        </div>
    )
}
