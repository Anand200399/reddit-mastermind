import { supabase } from '@/lib/supabase'

function buildTree(comments: any[]) {
  const byId = new Map<string, any>()
  comments.forEach((c) => byId.set(c.id, { ...c, children: [] }))

  const roots: any[] = []
  comments.forEach((c) => {
    const node = byId.get(c.id)
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

function CommentNode({ node, depth = 0 }: { node: any; depth?: number }) {
  return (
    <div style={{ marginLeft: depth * 18, borderLeft: depth ? '1px solid #333' : 'none', paddingLeft: depth ? 12 : 0, marginTop: 10 }}>
      <div style={{ fontSize: 13, opacity: 0.9 }}>
        <strong>{node.personas?.username}</strong> • {new Date(node.scheduled_at).toUTCString()}
      </div>
      <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{node.comment_text}</div>

      {node.children?.map((child: any) => (
        <CommentNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export default async function PostThreadPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params

  const { data: post, error: pErr } = await supabase
    .from('posts')
    .select('id, title, body, scheduled_at, keyword_ids, subreddits(name), personas(username)')
    .eq('id', postId)
    .single()

  if (pErr || !post) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Post not found</h1>
        <p>{pErr?.message}</p>
      </main>
    )
  }

  const { data: comments } = await supabase
    .from('comments')
    .select('id, parent_comment_id, comment_text, scheduled_at, personas(username)')
    .eq('post_id', postId)
    .order('scheduled_at', { ascending: true })

  const tree = buildTree(comments ?? [])

  return (
    <main style={{ padding: 24 }}>
      <div style={{ opacity: 0.9 }}>
        <div>
          <strong>{post.subreddits?.name}</strong> • posted by <strong>{post.personas?.username}</strong> • {new Date(post.scheduled_at).toUTCString()}
        </div>
      </div>

      <h1 style={{ marginTop: 14 }}>{post.title}</h1>
      <div style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{post.body}</div>

      <h2 style={{ marginTop: 24 }}>Comments</h2>
      {tree.length === 0 ? <p>No comments</p> : tree.map((n: any) => <CommentNode key={n.id} node={n} />)}
    </main>
  )
}
