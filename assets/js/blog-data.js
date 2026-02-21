/* blog-data.js — Anshul Namdev's personal blog posts
   Add/edit entries here. The blog.js renderer picks these up automatically. */

const BLOG_POSTS = [
    {
        id: 'hn-rag-pipelines',
        title: 'Understanding RAG Pipelines: From Theory to n8n Workflow',
        excerpt: 'Retrieval-Augmented Generation demystified — how vector search, chunking strategies, and re-ranking work together, and how I wired the whole thing in n8n without writing a single line of Python.',
        date: '2026-02-10',
        category: 'Writing',
        tags: ['AI', 'n8n', 'RAG', 'LLM'],
        url: '#',
        readTime: 9
    },
    {
        id: 'ai-workflow-first',
        title: 'Building My First Production AI Workflow in n8n',
        excerpt: 'A walk through the mistakes, debugging sessions, and eventual triumph of shipping a real, live AI automation that handles customer queries end-to-end — all without a backend server.',
        date: '2026-01-28',
        category: 'Dev Log',
        tags: ['n8n', 'Automation', 'AI'],
        url: '#',
        readTime: 7
    },
    {
        id: 'rust-ownership',
        title: "Rust's Ownership Model Finally Clicked — Here's How",
        excerpt: "After three failed attempts I finally understood Rust ownership. It wasn't a tutorial that helped — it was visualising the stack and heap. This is that mental model.",
        date: '2026-01-15',
        category: 'Tutorial',
        tags: ['Rust', 'Systems', 'Memory'],
        url: '#',
        readTime: 11
    },
    {
        id: 'llm-prompt-engineering',
        title: 'Prompt Engineering is Software Engineering',
        excerpt: 'Stop treating prompts as magic incantations. They are interfaces. Here are the principles I use — input validation, version control, output contracts — applied to LLM prompts.',
        date: '2025-12-20',
        category: 'Writing',
        tags: ['LLM', 'AI', 'Best Practices'],
        url: '#',
        readTime: 6
    },
    {
        id: 'axshul-site-build',
        title: 'How I Built This Portfolio — No Framework, Just Vibes',
        excerpt: 'No React, no build step, no bundler. Just HTML, vanilla CSS with custom properties, and careful typography. Here\'s what I learned building axshul.site from scratch.',
        date: '2025-12-05',
        category: 'Dev Log',
        tags: ['Portfolio', 'CSS', 'Web'],
        url: '#',
        readTime: 8
    },
    {
        id: 'java-async',
        title: 'Async Java Is Actually Good in 2025 — Virtual Threads Deep Dive',
        excerpt: 'Project Loom\'s virtual threads change everything about writing concurrent Java. Benchmarks, gotchas, and when to reach for them vs. reactive streams.',
        date: '2025-11-18',
        category: 'Tutorial',
        tags: ['Java', 'Concurrency', 'Performance'],
        url: '#',
        readTime: 14
    }
];
