window.PH = window.PH || {};

PH.ai = (() => {
  // All requests go through your own Vercel serverless function.
  // The actual GROQ_API_KEY lives in .env.local (local) and Vercel
  // Environment Variables (production) — never in this file.
  const PROXY_URL = '/api/generate';

  // Models in priority order — auto-rotates on rate limit or error
  const MODELS = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', maxTokens: 4096 },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', maxTokens: 4096 },
    { id: 'llama3-70b-8192',         name: 'Llama 3 70B',   maxTokens: 4096 },
    { id: 'mixtral-8x7b-32768',      name: 'Mixtral 8x7B',  maxTokens: 4096 },
    { id: 'llama3-8b-8192',          name: 'Llama 3 8B',    maxTokens: 3000 },
  ];

  let activeModelIndex = 0;
  let lastUsedModel = null;

  async function callGroq(messages, attempt = 0) {
    if (attempt >= MODELS.length) {
      throw new Error('All models exhausted. Check your API key or try again later.');
    }

    const model = MODELS[(activeModelIndex + attempt) % MODELS.length];

    let response;
    try {
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model.id,
          messages,
          temperature: 0.85,
          max_tokens: model.maxTokens,
        }),
      });
    } catch (networkErr) {
      throw new Error('Network error — run via `vercel dev` locally, not by opening index.html directly.');
    }

    if (response.status === 429 || response.status === 503 || response.status === 502) {
      console.warn(`[PH.ai] ${model.name} unavailable (${response.status}), trying next model...`);
      return callGroq(messages, attempt + 1);
    }

    if (response.status === 500) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Server error. Make sure GROQ_API_KEY is set in Vercel environment variables.');
    }

    if (response.status === 401) {
      throw new Error('Invalid API key. Check GROQ_API_KEY in your Vercel environment variables.');
    }

    if (!response.ok) {
      if (attempt < MODELS.length - 1) {
        console.warn(`[PH.ai] ${model.name} error (${response.status}), trying next model...`);
        return callGroq(messages, attempt + 1);
      }
      const errBody = await response.text().catch(() => '');
      throw new Error(`API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI. Please try again.');
    }

    lastUsedModel = model.name;
    activeModelIndex = (activeModelIndex + attempt) % MODELS.length;

    return { content, model: model.name };
  }

  function parseJSON(text) {
    let clean = text.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No valid JSON found in AI response. Try again.');
    clean = clean.slice(start, end + 1);
    try {
      return JSON.parse(clean);
    } catch (e) {
      throw new Error('AI returned malformed JSON. Try again.');
    }
  }

  async function generateProjectIdea({ category, difficulty, techStack }) {
    const systemPrompt = `You are a senior software architect and product designer.
Generate creative, technically sound, and actually buildable project ideas.
You MUST respond with a valid JSON object only — no preamble, no explanation, no markdown fences.
Every string field must be filled. Every array must have at least 3 items.`;

    const userPrompt = `Generate a unique project idea with these constraints:
- Category: ${category}
- Difficulty: ${difficulty}
- Preferred Tech Stack: ${techStack.length ? techStack.join(', ') : "Developer's choice"}

Return ONLY a raw JSON object with this exact structure (no markdown, no explanation):
{
  "title": "Specific, memorable project name",
  "tagline": "One punchy sentence describing the project",
  "problem": "Clear description of the real-world problem this solves (2-3 sentences)",
  "solution": "How the project solves it with a technical angle (2-3 sentences)",
  "features": [
    "Feature 1 — brief description",
    "Feature 2 — brief description",
    "Feature 3 — brief description",
    "Feature 4 — brief description",
    "Feature 5 — brief description"
  ],
  "techStack": ["tech1", "tech2", "tech3", "tech4"],
  "difficulty": "${difficulty}",
  "buildTime": "X hours or X days or X weeks",
  "roadmap": [
    { "step": 1, "title": "Project Setup", "description": "Initialize repo, configure tooling, set up dev environment" },
    { "step": 2, "title": "Core Architecture", "description": "Design data models, API structure, core business logic" },
    { "step": 3, "title": "Core Functionality", "description": "Implement the main features of the application" },
    { "step": 4, "title": "User Interface", "description": "Build UI components, responsive design, UX polish" },
    { "step": 5, "title": "Testing & Debugging", "description": "Unit tests, integration tests, bug fixes" },
    { "step": 6, "title": "Deployment", "description": "CI/CD setup, production deployment, monitoring" }
  ],
  "extensions": [
    "Future extension 1",
    "Future extension 2",
    "Future extension 3"
  ],
  "repoName": "kebab-case-repo-name"
}`;

    const { content, model } = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = parseJSON(content);
    parsed._model = model;
    return parsed;
  }

  async function generateGithubArtifacts(project) {
    const systemPrompt = `You are an expert open-source developer.
Generate production-quality GitHub repository artifacts.
You MUST respond with a valid JSON object only — no preamble, no markdown outside JSON string values.`;

    const userPrompt = `Generate GitHub repository artifacts for this project:
Title: ${project.title}
Description: ${project.tagline}
Tech Stack: ${project.techStack.join(', ')}
Difficulty: ${project.difficulty}

Return ONLY a raw JSON object (no markdown fences, no explanation):
{
  "readme": "Full README.md content as a string. Use \\n for newlines. Include: badges, Description, Features, Tech Stack, Getting Started, Installation, Usage, Contributing, License sections.",
  "folderStructure": "ASCII folder tree as a string. Use \\n for newlines. Show 15-25 realistic files and folders for the tech stack.",
  "gitignore": "Complete .gitignore file content as a string. Use \\n for newlines. Cover all patterns relevant to ${project.techStack.join(', ')}."
}`;

    const { content, model } = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = parseJSON(content);
    parsed._model = model;
    return parsed;
  }

  return {
    generateProjectIdea,
    generateGithubArtifacts,
    getLastModel: () => lastUsedModel,
    getModels: () => MODELS.map(m => m.name),
  };
})();