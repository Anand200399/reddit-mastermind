-- COMPANY
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  description text,
  posts_per_week int not null default 3,
  created_at timestamptz default now()
);

-- PERSONAS (Reddit accounts)
create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  username text not null,
  bio text not null
);

-- SUBREDDITS
create table if not exists subreddits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  max_posts_per_week int default 2,
  notes text
);

-- KEYWORDS / TARGET QUERIES
create table if not exists keywords (
  id text primary key,
  company_id uuid references companies(id) on delete cascade,
  keyword text not null
);

-- WEEKS (calendar grouping)
create table if not exists weeks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  week_start date not null,
  week_number int not null,
  created_at timestamptz default now(),
  unique (company_id, week_start)
);

-- POSTS (planned Reddit posts)
create table if not exists posts (
  id text primary key,
  week_id uuid references weeks(id) on delete cascade,
  subreddit_id uuid references subreddits(id),
  title text not null,
  body text not null,
  author_persona_id uuid references personas(id),
  scheduled_at timestamptz not null,
  keyword_ids text[] not null default '{}'
);

-- COMMENTS (planned comment threads)
create table if not exists comments (
  id text primary key,
  post_id text references posts(id) on delete cascade,
  parent_comment_id text references comments(id),
  persona_id uuid references personas(id),
  comment_text text not null,
  scheduled_at timestamptz not null
);
