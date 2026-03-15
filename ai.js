window.PH = window.PH || {};

PH.ai = (() => {
  // All requests go through your own Vercel serverless function.
  // The actual GROQ_API_KEY lives in .env.local (local) and Vercel
  // Environment Variables (production) — never in this file.
  const PROXY_URL = '/api/generate';

  // Models in priority order — auto-rotates on rate limit or error
  const MODELS = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', maxTokens: 4096 },
    { id: 'qwen/qwen3-32b',                          name: 'Qwen 3 32B',          maxTokens: 4096 },
    { id: 'openai/gpt-oss-20b',                      name: 'GPT OSS 20B',         maxTokens: 4096 },
    { id: 'openai/gpt-oss-120b',                     name: 'GPT OSS 120B',        maxTokens: 4096 },
    { id: 'llama-3.1-8b-instant',                    name: 'Llama 3.1 8B Instant', maxTokens: 3000 },
  ];

  let activeModelIndex = 0;
  let lastUsedModel = null;

  async function readResponseBody(response) {
    const text = await response.text().catch(() => '');
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  function normalizeList(value, minItems = 0) {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => String(item ?? '').trim())
      .filter(Boolean)
      .slice(0, Math.max(value.length, minItems));
  }

  function normalizeRoadmap(value) {
    if (!Array.isArray(value)) return [];

    return value
      .map((item, index) => {
        const step = Number(item?.step) || index + 1;
        const title = String(item?.title ?? '').trim();
        const description = String(item?.description ?? '').trim();

        if (!title || !description) return null;

        return { step, title, description };
      })
      .filter(Boolean);
  }

  function ensureIdeaShape(parsed, requestedDifficulty, requestedStack) {
    const features = normalizeList(parsed.features, 3);
    const techStack = normalizeList(parsed.techStack, 3);
    const extensions = normalizeList(parsed.extensions, 3);
    const roadmap = normalizeRoadmap(parsed.roadmap);

    const idea = {
      title: String(parsed.title ?? '').trim(),
      tagline: String(parsed.tagline ?? '').trim(),
      problem: String(parsed.problem ?? '').trim(),
      solution: String(parsed.solution ?? '').trim(),
      features,
      techStack: techStack.length ? techStack : requestedStack,
      difficulty: String(parsed.difficulty ?? requestedDifficulty).trim() || requestedDifficulty,
      buildTime: String(parsed.buildTime ?? '').trim(),
      roadmap,
      extensions,
      repoName: String(parsed.repoName ?? '').trim(),
    };

    if (!idea.title || !idea.tagline || !idea.problem || !idea.solution || !idea.buildTime || !idea.repoName) {
      throw new Error('AI response was missing required project details. Please try again.');
    }

    if (idea.features.length < 3 || idea.techStack.length < 3 || idea.extensions.length < 3 || idea.roadmap.length < 3) {
      throw new Error('AI response was incomplete. Please try again.');
    }

    return idea;
  }

  function ensureGithubArtifactsShape(parsed) {
    const artifacts = {
      readme: String(parsed.readme ?? '').trim(),
      folderStructure: String(parsed.folderStructure ?? '').trim(),
      gitignore: String(parsed.gitignore ?? '').trim(),
    };

    if (!artifacts.readme || !artifacts.folderStructure || !artifacts.gitignore) {
      throw new Error('AI response was missing GitHub repository artifacts. Please try again.');
    }

    return artifacts;
  }

  async function callGroq(messages, attempt = 0) {
    if (attempt >= MODELS.length) {
      throw new Error('All models exhausted. Check your API key or try again later.');
    }

    const model = MODELS[(activeModelIndex + attempt) % MODELS.length];
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 45000);

    let response;
    try {
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: model.id,
          messages,
          temperature: 0.85,
          max_tokens: model.maxTokens,
        }),
      });
    } catch (networkErr) {
      if (networkErr.name === 'AbortError') {
        throw new Error('AI request timed out. Please try again.');
      }
      throw new Error('Network error — run via `vercel dev` locally, not by opening index.html directly.');
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (response.status === 429 || response.status === 503 || response.status === 502) {
      console.warn(`[PH.ai] ${model.name} unavailable (${response.status}), trying next model...`);
      return callGroq(messages, attempt + 1);
    }

    if (response.status === 500) {
      const err = await readResponseBody(response);
      throw new Error(err.error || 'Server error. Make sure GROQ_API_KEY is set in Vercel environment variables.');
    }

    if (response.status === 404) {
      throw new Error('AI endpoint not found. Deploy on Vercel or run the project with `vercel dev` locally.');
    }

    if (response.status === 401) {
      throw new Error('Invalid API key. Check GROQ_API_KEY in your Vercel environment variables.');
    }

    if (!response.ok) {
      if (attempt < MODELS.length - 1) {
        console.warn(`[PH.ai] ${model.name} error (${response.status}), trying next model...`);
        return callGroq(messages, attempt + 1);
      }
      const errBody = await readResponseBody(response);
      throw new Error(errBody.error || `API error ${response.status}.`);
    }

    const data = await readResponseBody(response);
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
    const idea = ensureIdeaShape(parsed, difficulty, techStack);
    idea._model = model;
    return idea;
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
    const artifacts = ensureGithubArtifactsShape(parsed);
    artifacts._model = model;
    return artifacts;
  }

  return {
    generateProjectIdea,
    generateGithubArtifacts,
    getLastModel: () => lastUsedModel,
    getModels: () => MODELS.map(m => m.name),
  };
})();
