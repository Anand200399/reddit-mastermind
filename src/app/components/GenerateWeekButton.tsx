'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function GenerateWeekButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div style={{ margin: '16px 0' }}>
      <button
        onClick={async () => {
          setLoading(true)
          setMsg(null)
          try {
            const res = await fetch('/api/generate-week', { method: 'POST' })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error ?? 'Failed')
            setMsg(`Created Week ${json.week.week_number}: ${json.created.posts} posts, ${json.created.comments} comments`)
            router.refresh()
            router.push('/calendar')
          } catch (e: any) {
            setMsg(e.message)
          } finally {
            setLoading(false)
          }
        }}
        disabled={loading}
        style={{
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid #444',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating…' : 'Generate Week'}
      </button>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  )
}
