# Project Hub

> **Build something brilliant.**

A premium, AI-powered platform that generates high-quality project ideas, roadmaps, and GitHub-ready structures.

## Features

- 🤖 **AI Project Idea Generator** — Category, difficulty, and tech stack aware
- 🗺️ **Project Roadmap** — Step-by-step build plan
- 🐙 **GitHub Repo Generator** — README, folder structure, .gitignore
- 🔥 **Trending Ideas** — Curated cards for inspiration
- 💾 **Save Ideas** — localStorage-based idea vault
- ⏱️ **Build Time Estimator** — Beginner to Advanced
- 📋 **Copy Everything** — One-click copy for all content
- 🌓 **Dark / Light Mode** — System-aware with manual toggle

## Stack

- HTML + CSS (custom design system)
- Vanilla JavaScript (modular, no bundler needed)
- GSAP + ScrollTrigger (animations)
- Lucide Icons
- Groq API (auto model rotation: llama-3.3-70b → fallbacks)

## Setup

1. Clone the repo
2. Open `utils/ai.js`
3. Replace `YOUR_GROQ_API_KEY` with your actual key from [console.groq.com](https://console.groq.com)
4. Open `index.html` in a browser — or deploy to Vercel

## Deploy to Vercel

```bash
npx vercel
```

No build step needed. Static site, deploys instantly.

## Folder Structure

```
project-hub/
├── index.html
├── style.css
├── app.js
├── components/
│   ├── generator.js
│   ├── roadmap.js
│   ├── github.js
│   ├── trending.js
│   └── storage.js
├── data/
│   └── categories.js
├── utils/
│   ├── ai.js
│   └── helpers.js
└── assets/
    └── logo.svg
```

## AI Models Used (Auto-Rotation)

| Priority | Model | Tokens |
|----------|-------|--------|
| 1 | llama-3.3-70b-versatile | 4096 |
| 2 | llama-3.1-70b-versatile | 4096 |
| 3 | llama3-70b-8192 | 4096 |
| 4 | mixtral-8x7b-32768 | 4096 |
| 5 | llama3-8b-8192 | 3000 |

If a model hits a rate limit or returns an error, the system automatically falls back to the next one.

## License

MIT
