import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: companies } = await supabase.from('companies').select('*')
  const { data: personas } = await supabase.from('personas').select('*')
  const { data: subreddits } = await supabase.from('subreddits').select('*')
  const { data: keywords } = await supabase.from('keywords').select('*')

  return (
    <main style={{ padding: 24 }}>
      <h1>Reddit Mastermind – Data Check</h1>

      <h2>Companies</h2>
      <pre>{JSON.stringify(companies, null, 2)}</pre>

      <h2>Personas</h2>
      <pre>{JSON.stringify(personas, null, 2)}</pre>

      <h2>Subreddits</h2>
      <pre>{JSON.stringify(subreddits, null, 2)}</pre>

      <h2>Keywords</h2>
      <pre>{JSON.stringify(keywords, null, 2)}</pre>
    </main>
  )
}
