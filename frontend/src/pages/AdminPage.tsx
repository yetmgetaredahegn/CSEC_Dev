import { useEffect, useRef, useState } from 'react'

import { apiDeleteDocument, apiFetchDocuments, apiUploadDocument } from '../api/client'

interface DocumentItem {
  id: number
  title: string
  file: string
  processed: boolean
  created_at: string
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const loadDocuments = async () => {
    setError('')
    try {
      const data = await apiFetchDocuments()
      setDocuments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !title.trim()) {
      setError('Please provide a title and PDF file.')
      return
    }
    setError('')
    setIsUploading(true)
    try {
      await apiUploadDocument(title.trim(), file)
      setTitle('')
      if (fileRef.current) {
        fileRef.current.value = ''
      }
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    setError('')
    try {
      await apiDeleteDocument(id)
      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-3xl font-semibold text-white">Knowledge Base Admin</h1>
      <p className="mt-2 text-sm text-slate-400">
        Upload PDFs and monitor processing status from here.
      </p>

      <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Upload documents</h2>
            <p className="text-sm text-slate-400">Only admins can upload and manage files.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr_auto]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Document title"
              className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100"
            />
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-900"
            />
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="rounded-2xl bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
            >
              {isUploading ? 'Uploading...' : 'Add PDF'}
            </button>
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </div>
      </div>

      <div className="mt-10 grid gap-4">
        {documents.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400">
            No documents uploaded yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-white">{doc.title}</p>
                <p className="text-xs text-slate-400">
                  {doc.processed ? 'Processed' : 'Processing'} ·{' '}
                  {new Date(doc.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="rounded-full border border-rose-400/50 px-4 py-2 text-xs font-semibold text-rose-300"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
