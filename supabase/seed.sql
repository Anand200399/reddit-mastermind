-- Seed company
with company as (
  insert into companies (name, website, description, posts_per_week)
  values (
    'Slideforge',
    'slideforge.ai',
    'Slideforge is an AI-powered presentation and storytelling tool that turns rough notes into polished, professional slide decks.',
    3
  )
  returning id
)

-- Seed subreddits
insert into subreddits (company_id, name, max_posts_per_week, notes)
select id, name, max_posts, notes
from company,
  (values
    ('r/PowerPoint', 2, 'Presentation tips, PowerPoint workflows, deck feedback'),
    ('r/ClaudeAI', 2, 'AI workflows, prompt discussions, tool comparisons'),
    ('r/Canva', 2, 'Design tools, Canva templates, presentation design')
  ) as s(name, max_posts, notes);

-- Seed personas
insert into personas (company_id, username, bio)
select id, username, bio
from company,
  (values
    ('riley_ops','Riley Hart — operations lead at a fast-growing startup. Practical, metrics-driven, concise.'),
    ('jordan_consults','Jordan Brooks — independent consultant. Straight shooter, outcome-focused.'),
    ('emily_econ','Emily Chen — economics student who likes simple tools and clear explanations.'),
    ('alex_sells','Alex Ramirez — head of sales at a SaaS company. Opinionated, direct, speed-focused.'),
    ('priya_pm','Priya Nandakumar — product manager thinking in workflows, UX, and tradeoffs.')
  ) as p(username, bio);

-- Seed keywords
insert into keywords (company_id, keyword)
select id, keyword
from company,
  (values
    ('best ai presentation maker'),
    ('ai slide deck tool'),
    ('pitch deck generator'),
    ('alternatives to PowerPoint'),
    ('how to make slides faster'),
    ('design help for slides'),
    ('Canva alternative for presentations'),
    ('Claude vs Slideforge'),
    ('best tool for business decks'),
    ('automate my presentations'),
    ('need help with pitch deck'),
    ('tools for consultants'),
    ('tools for startups'),
    ('best ai design tool'),
    ('Google Slides alternative'),
    ('best storytelling tool')
  ) as k(keyword);
