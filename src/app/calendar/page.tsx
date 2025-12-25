import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import WeekSelector from '@/app/components/WeekSelector'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  // STEP 1: read selected week from URL (?week=1)
  const params = await searchParams
  const selectedWeekNumber = params.week ? Number(params.week) : null

  // STEP 2: fetch all weeks for dropdown
  const { data: allWeeks } = await supabase
    .from('weeks')
    .select('id, week_number, week_start')
    .order('week_number', { ascending: false })

  // STEP 3: decide which week to show
  let week: any = null

  if (selectedWeekNumber) {
    const { data } = await supabase
      .from('weeks')
      .select('*')
      .eq('week_number', selectedWeekNumber)
      .single()
    week = data
  } else {
    week = allWeeks?.[0] // latest week by default
  }

  if (!week) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Calendar</h1>
        <p>No weeks generated yet. Go back and click “Generate Week”.</p>
      </main>
    )
  }

  // keywords map
  const { data: allKeywords } = await supabase.from('keywords').select('id, keyword')
  const keywordMap = new Map((allKeywords ?? []).map((k: any) => [k.id, k.keyword]))

  // STEP 4: fetch posts for selected week
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, scheduled_at, keyword_ids, subreddits(name), personas(username)')
    .eq('week_id', week.id)
    .order('scheduled_at', { ascending: true })

  return (
    <main style={{ padding: 24 }}>
          <Link
    href="/"
    style={{
      display: 'inline-block',
      textDecoration: 'underline',
      marginBottom: 12,
      opacity: 0.9,
    }}
  >
    ← Back to Home
  </Link>
      <h1>Week {week.week_number} Calendar</h1>
      <p>Week start: {week.week_start}</p>

      {/* ✅ Week dropdown */}
      <WeekSelector weeks={allWeeks ?? []} />

      <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: 8 }}>When</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: 8 }}>Subreddit</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: 8 }}>Author</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: 8 }}>Title</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: 8 }}>Keywords</th>
          </tr>
        </thead>
        <tbody>
          {posts?.map((p: any) => (
            <tr key={p.id}>
              <td style={{ padding: 8, borderBottom: '1px solid #222' }}>
                {new Date(p.scheduled_at).toUTCString()}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{p.subreddits?.name}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{p.personas?.username}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #222' }}>
                <Link href={`/calendar/${p.id}`} style={{ textDecoration: 'underline' }}>
                  {p.title}
                </Link>
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #222' }}>
                {(p.keyword_ids ?? []).map((id: string) => keywordMap.get(id) ?? id).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
