# Project Hub

> **Build something brilliant.**

A premium, AI-powered platform that generates high-quality project ideas, roadmaps, and GitHub-ready structures.

## Features

- **AI Project Idea Generator** — Category, difficulty, and tech stack aware
- **Project Roadmap** — Step-by-step build plan
- **GitHub Repo Generator** — README, folder structure, .gitignore
- **Trending Ideas** — Curated cards for inspiration
- **Save Ideas** — localStorage-based idea vault
- **Build Time Estimator** — Beginner to Advanced
- **Copy Everything** — One-click copy for all content
- **Dark / Light Mode** — System-aware with manual toggle

## Stack

- HTML + CSS (custom design system)
- Vanilla JavaScript (modular, no bundler needed)
- GSAP + ScrollTrigger (animations)
- Lucide Icons
- Groq API (auto model rotation: llama-3.3-70b → fallbacks)

## Vision

Project Hub is meant to feel like a polished launchpad for developers:

- Pick a category, difficulty, and optional tech stack
- Generate a project idea that is specific enough to build, not generic filler
- Get a step-by-step roadmap and realistic build-time estimate
- Generate GitHub-ready artifacts like `README.md`, folder structure, and `.gitignore`
- Save strong ideas locally and revisit them later

## Local Development

This project uses a Vercel serverless function for AI requests, so do not open `index.html` directly in the browser.

1. Create a local env file:

```bash
cp .env.example .env.local
```

2. Add your Groq key to `.env.local`:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

3. Run the app with Vercel so `/api/generate` works:

```bash
vercel dev
```

4. Open the local URL Vercel prints in the terminal.

## Deploying To Vercel

1. Import the repo into Vercel.
2. Add `GROQ_API_KEY` in Project Settings -> Environment Variables.
3. Redeploy.

## Notes

- `.env.local` is already gitignored and should not be committed.
- If a key was previously exposed anywhere public, rotate it before pushing.
