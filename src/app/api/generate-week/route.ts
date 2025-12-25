import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

type Company = {
  id: string
  posts_per_week: number
}

/** ---------- Date helpers ---------- */
function startOfWeekMonday(date: Date) {
  // Monday as start of week
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() // 0=Sun..6=Sat
  const diffToMonday = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diffToMonday)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function addDaysUTC(date: Date, days: number) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function iso(d: Date) {
  return d.toISOString()
}

/** ---------- 1A) Random / selection helpers ---------- */
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sample<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)]
}

function sampleManyUnique<T>(arr: T[], count: number) {
  const copy = [...arr]
  const out: T[] = []
  while (copy.length && out.length < count) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0])
  }
  return out
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** ---------- 1H) Persona-tone helpers ---------- */
function tone(bio: string) {
  const b = (bio ?? '').toLowerCase()
  if (b.includes('sales')) return 'sales'
  if (b.includes('operations')) return 'ops'
  if (b.includes('product')) return 'pm'
  if (b.includes('consultant')) return 'consult'
  return 'general'
}

function commentLine(t: string) {
  if (t === 'pm') return 'I’d frame it as: story first, then design. What decision should the deck drive?'
  if (t === 'ops') return 'If you want speed, standardize structure. Template + checklist beats hunting for perfect layouts.'
  if (t === 'sales') return 'For client decks, clarity beats fancy visuals. Make the narrative obvious in 30 seconds.'
  if (t === 'consult') return 'Pick a repeatable structure and stop re-inventing slides. Most decks are the same 80/20.'
  return 'I’ve tried a few approaches — outline first helps a lot.'
}

export async function POST() {
  // 1) Load the (only) company
  const { data: companies, error: cErr } = await supabaseServer.from('companies').select('id, posts_per_week').limit(1)

  if (cErr || !companies?.length) {
    return NextResponse.json({ error: cErr?.message ?? 'No company found' }, { status: 500 })
  }

  const company = companies[0] as Company

  // 2) Load personas/subreddits/keywords for this company
  const [{ data: personas, error: pErr }, { data: subreddits, error: sErr }, { data: keywords, error: kErr }] =
    await Promise.all([
      supabaseServer.from('personas').select('id, username, bio').eq('company_id', company.id),
      supabaseServer.from('subreddits').select('id, name, max_posts_per_week, notes').eq('company_id', company.id),
      supabaseServer.from('keywords').select('id, keyword').eq('company_id', company.id),
    ])

  if (pErr || sErr || kErr) {
    return NextResponse.json(
      { error: pErr?.message || sErr?.message || kErr?.message || 'Failed loading inputs' },
      { status: 500 }
    )
  }
  if (!personas?.length || !subreddits?.length || !keywords?.length) {
    return NextResponse.json({ error: 'Missing personas/subreddits/keywords' }, { status: 400 })
  }

  // 3) Determine next week_start + week_number
  const { data: lastWeeks } = await supabaseServer
    .from('weeks')
    .select('week_start, week_number')
    .eq('company_id', company.id)
    .order('week_number', { ascending: false })
    .limit(1)

  const today = new Date()
  let weekStart = startOfWeekMonday(today)
  let weekNumber = 1

  if (lastWeeks?.length) {
    const last = lastWeeks[0]
    weekNumber = (last.week_number ?? 0) + 1
    weekStart = addDaysUTC(new Date(last.week_start + 'T00:00:00Z'), 7)
  }

  // 4) Create week row
  const { data: weekRow, error: wErr } = await supabaseServer
    .from('weeks')
    .insert([{ company_id: company.id, week_start: weekStart.toISOString().slice(0, 10), week_number: weekNumber }])
    .select('*')
    .single()

  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 })

  // 1B) Template pools (titles + bodies)
  const titleTemplates = [
    'How are you making slides faster these days? (tools/workflow)',
    'Best AI presentation maker for client decks? Looking for honest takes',
    'PowerPoint vs Canva vs AI tools — what actually works for business decks?',
    'Anyone found a reliable “pitch deck generator” that doesn’t look generic?',
    'What’s your workflow to go from outline → clean slides quickly?',
    'If you had to pick ONE tool for business decks, what would it be and why?',
  ]

  const bodyTemplates = [
    (kws: string[]) =>
      `Context: I make a lot of decks for work and I’m trying to reduce time spent on formatting.\n\n` +
      `Optimizing for:\n- speed (first draft fast)\n- decent design without spending hours\n- easy edits + export\n\n` +
      `If you’ve tried tools like ${kws.join(' / ')} — what worked and what didn’t?\nAny workflows you recommend?`,

    (kws: string[]) =>
      `I’m rebuilding my deck workflow and trying to standardize it.\n\n` +
      `Goal: produce a “good enough” first draft in < 30 minutes, then polish.\n` +
      `I’m experimenting with ${kws.join(', ')}.\n\n` +
      `What do you use for structure (story) vs layout (design)?`,

    (kws: string[]) =>
      `I keep bouncing between PowerPoint/Canva and newer AI tools.\n\n` +
      `What I want:\n- clean layouts\n- consistent theme\n- easy re-ordering / edits\n\n` +
      `If you’ve used ${kws.join(' / ')}, what are the real tradeoffs?`,
  ]

  // 1C) Pull recent history (avoid repetition + help rotation)
  const { data: recentPosts } = await supabaseServer
    .from('posts')
    .select('title, subreddit_id, author_persona_id, keyword_ids')
    .order('scheduled_at', { ascending: false })
    .limit(30)

  const recentTitles = new Set((recentPosts ?? []).map((p: any) => p.title))
  const recentKeywordIds = new Set((recentPosts ?? []).flatMap((p: any) => p.keyword_ids ?? []))
  const recentSubredditIds = (recentPosts ?? []).map((p: any) => p.subreddit_id)
  const recentAuthorIds = (recentPosts ?? []).map((p: any) => p.author_persona_id)

  const postsPerWeek = Math.max(1, company.posts_per_week ?? 3)

  // Mon..Fri offsets, we will pick from these with some variety
  const defaultDayOffsets = [1, 2, 3, 4, 5]

  // 1D) Track weekly subreddit caps
  const subredditWeekCounts = new Map<string, number>()

  const usedSubredditIds: string[] = []
  const usedPersonaIds: string[] = []

  const postsToInsert: any[] = []
  const commentsToInsert: any[] = []

  for (let i = 0; i < postsPerWeek; i++) {
    // day selection: cycle Tue–Fri-ish
    const dayOffset = defaultDayOffsets[i % defaultDayOffsets.length]
    const scheduled = addDaysUTC(weekStart, dayOffset)

    // 1F) vary scheduled time a bit (16:00–21:45 UTC)
    scheduled.setUTCHours(randInt(16, 21), [0, 15, 30, 45][randInt(0, 3)], 0, 0)

    // 1D) Pick subreddit respecting weekly cap + avoid immediate repetition
    const shuffledSubs = shuffle(subreddits)

    let subreddit =
      shuffledSubs.find((s: any) => {
        const used = subredditWeekCounts.get(s.id) ?? 0
        const cap = s.max_posts_per_week ?? 999
        const notSameAsLast = !usedSubredditIds.length || s.id !== usedSubredditIds[usedSubredditIds.length - 1]
        return used < cap && notSameAsLast
      }) ?? sample(subreddits)

    subredditWeekCounts.set(subreddit.id, (subredditWeekCounts.get(subreddit.id) ?? 0) + 1)
    usedSubredditIds.push(subreddit.id)

    // Pick author persona: avoid immediate repetition; also gently avoid recent authors
    const shuffledAuthors = shuffle(personas)
    let author =
      shuffledAuthors.find((p: any) => {
        const notSameAsLast = !usedPersonaIds.length || p.id !== usedPersonaIds[usedPersonaIds.length - 1]
        const notOverusedRecently = recentAuthorIds.slice(0, 3).includes(p.id) ? false : true
        return notSameAsLast && notOverusedRecently
      }) ?? sample(personas)

    usedPersonaIds.push(author.id)

    // 1G) Pick keywords avoiding recently used
    const keywordPool = keywords.filter((k: any) => !recentKeywordIds.has(k.id))
    const pool = keywordPool.length >= 6 ? keywordPool : keywords
    const chosen = sampleManyUnique(pool, randInt(2, 3))
    chosen.forEach((k: any) => recentKeywordIds.add(k.id))
    const keywordText = chosen.map((k: any) => k.keyword)

    const postId = `P${weekNumber}-${i + 1}`

    // 1E) Non-repeating title selection
    const availableTitles = titleTemplates.filter((t) => !recentTitles.has(t))
    const title = (availableTitles.length ? sample(availableTitles) : sample(titleTemplates))
    recentTitles.add(title)

    // Body: pick a template for variety
    const body = sample(bodyTemplates)(keywordText.slice(0, Math.min(3, keywordText.length)))

    postsToInsert.push({
      id: postId,
      week_id: weekRow.id,
      subreddit_id: subreddit.id,
      title,
      body,
      author_persona_id: author.id,
      scheduled_at: iso(scheduled),
      keyword_ids: chosen.map((k: any) => k.id),
    })

    // ---------- Comments (4 total with nesting) ----------
    const commenters = personas.filter((p: any) => p.id !== author.id)
    const c1Persona = sample(commenters)
    const c2Persona = sample(commenters.filter((p: any) => p.id !== c1Persona.id))
    const c3Persona = sample(commenters.filter((p: any) => p.id !== c1Persona.id && p.id !== c2Persona.id))

    // time gaps
    const c1Time = new Date(scheduled)
    c1Time.setUTCMinutes(c1Time.getUTCMinutes() + randInt(45, 90))

    const c2Time = new Date(c1Time)
    c2Time.setUTCMinutes(c2Time.getUTCMinutes() + randInt(60, 120))

    const c3Time = new Date(c2Time)
    c3Time.setUTCMinutes(c3Time.getUTCMinutes() + randInt(90, 180))

    const aTime = new Date(c3Time)
    aTime.setUTCMinutes(aTime.getUTCMinutes() + randInt(45, 120))

    const c1Id = `C${weekNumber}-${i + 1}-1`
    const c2Id = `C${weekNumber}-${i + 1}-2`
    const c3Id = `C${weekNumber}-${i + 1}-3`
    const aId = `C${weekNumber}-${i + 1}-4`

    const c1Tone = tone(c1Persona.bio)
    const c2Tone = tone(c2Persona.bio)
    const c3Tone = tone(c3Persona.bio)

    commentsToInsert.push(
      {
        id: c1Id,
        post_id: postId,
        parent_comment_id: null,
        persona_id: c1Persona.id,
        scheduled_at: iso(c1Time),
        comment_text: commentLine(c1Tone),
      },
      {
        id: c2Id,
        post_id: postId,
        parent_comment_id: c1Id,
        persona_id: c2Persona.id,
        scheduled_at: iso(c2Time),
        comment_text: commentLine(c2Tone),
      },
      {
        id: c3Id,
        post_id: postId,
        parent_comment_id: null,
        persona_id: c3Persona.id,
        scheduled_at: iso(c3Time),
        comment_text: `Quick question: are you optimizing for speed, “premium” design, or easy collaboration?`,
      },
      {
        id: aId,
        post_id: postId,
        parent_comment_id: c3Id,
        persona_id: author.id,
        scheduled_at: iso(aTime),
        comment_text:
          `Good point. Mostly speed + “good enough” design. I’m ok polishing ~10–15% manually but not spending hours aligning boxes.`,
      }
    )

    // small extra: gently avoid repeating the same subreddit too much recently
    // (not required, but helps realism)
    if (recentSubredditIds.length) {
      recentSubredditIds.unshift(subreddit.id)
      if (recentSubredditIds.length > 10) recentSubredditIds.pop()
    }
  }

  // Insert posts + comments
  const { error: postErr } = await supabaseServer.from('posts').insert(postsToInsert)
  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 })

  const { error: comErr } = await supabaseServer.from('comments').insert(commentsToInsert)
  if (comErr) return NextResponse.json({ error: comErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    week: { id: weekRow.id, week_number: weekRow.week_number, week_start: weekRow.week_start },
    created: { posts: postsToInsert.length, comments: commentsToInsert.length },
  })
}
