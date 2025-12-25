'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function WeekSelector({ weeks }: { weeks: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentWeek = searchParams.get('week')

  return (
    <select
      value={currentWeek ?? ''}
      onChange={(e) => {
        const week = e.target.value
        router.push(week ? `/calendar?week=${week}` : '/calendar')
      }}
      style={{ padding: 8, marginTop: 12 }}
    >
      <option value="">Latest week</option>
      {weeks.map((w) => (
        <option key={w.id} value={w.week_number}>
          Week {w.week_number} (starts {w.week_start})
        </option>
      ))}
    </select>
  )
}
