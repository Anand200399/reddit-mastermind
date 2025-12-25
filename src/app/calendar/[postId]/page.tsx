import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type PostRow = {
  id: string
  title: string
  body: string
  scheduled_at: string
  keyword_ids: string[] | null
  subreddits: { name: string } | null
  personas: { username: string } | null
}

type CommentRow = {
  id: string
  parent_comment_id: string | null
  comment_text: string
  scheduled_at: string
  personas: { username: string } | null
}

type CommentNodeType = CommentRow & { children: CommentNodeType[] }

function buildTree(comments: CommentRow[]) {
  const byId = new Map<string, CommentNodeType>()
  comments.forEach((c) => byId.set(c.id, { ...c, children: [] }))

  const roots: CommentNodeType[] = []

  comments.forEach((c) => {
    const node = byId.get(c.id)!
    if (c.parent_comment_id) {
      const parent = byId.get(c.parent_comment_id)
      if (parent) parent.children.push(node)
      else roots.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

function CommentNode({ node, depth = 0 }: { node: CommentNodeType; depth?: number }) {
  return (
    <div
      style={{
        marginLeft: depth * 18,
        borderLeft: depth ? '1px solid #333' : 'none',
        paddingLeft: depth ? 12 : 0,
        marginTop: 10,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.9 }}>
        <strong>{node.personas?.username ?? 'unknown'}</strong> •{' '}
        {new Date(node.scheduled_at).toUTCString()}
      </div>

      <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{node.comment_text}</div>

      {node.children?.map((child) => (
        <CommentNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export default async function PostThreadPage({
  params,
}: {
  params: { postId: string }
}) {
  const { postId } = params

  const { data, error: pErr } = await supabase
    .from('posts')
    .select('id, title, body, scheduled_at, keyword_ids, subreddits(name), personas(username)')
    .eq('id', postId)
    .single()

  if (pErr || !data) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Post not found</h1>
        <p>{pErr?.message}</p>
      </main>
    )
  }

  const post = data as unknown as PostRow

  const { data: commentsData } = await supabase
    .from('comments')
    .select('id, parent_comment_id, comment_text, scheduled_at, personas(username)')
    .eq('post_id', postId)
    .order('scheduled_at', { ascending: true })

  const comments = (commentsData ?? []) as unknown as CommentRow[]
  const tree = buildTree(comments)

  return (
    <main style={{ padding: 24 }}>
      <Link
        href="/calendar"
        style={{ textDecoration: 'underline', display: 'inline-block', marginBottom: 12 }}
      >
        ← Back to Calendar
      </Link>

      <div style={{ opacity: 0.9 }}>
        <div>
          <strong>{post.subreddits?.name ?? 'unknown subreddit'}</strong> • posted by{' '}
          <strong>{post.personas?.username ?? 'unknown'}</strong> •{' '}
          {new Date(post.scheduled_at).toUTCString()}
        </div>
      </div>

      <h1 style={{ marginTop: 14 }}>{post.title}</h1>
      <div style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{post.body}</div>

      <h2 style={{ marginTop: 24 }}>Comments</h2>
      {tree.length === 0 ? <p>No comments</p> : tree.map((n) => <CommentNode key={n.id} node={n} />)}
    </main>
  )
}
