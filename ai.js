window.PH = window.PH || {};

PH.ai = (() => {
  // Models in priority order — auto-rotates on rate limit or error
  const MODELS = [
    { id: 'llama-3.3-70b-versatile',  name: 'Llama 3.3 70B',   maxTokens: 4096 },
    { id: 'llama-3.1-70b-versatile',  name: 'Llama 3.1 70B',   maxTokens: 4096 },
    { id: 'llama3-70b-8192',          name: 'Llama 3 70B',      maxTokens: 4096 },
    { id: 'mixtral-8x7b-32768',       name: 'Mixtral 8x7B',     maxTokens: 4096 },
    { id: 'llama3-8b-8192',           name: 'Llama 3 8B',       maxTokens: 3000 },
  ];

  let activeModelIndex = 0;
  let lastUsedModel = null;

  async function callGroq(messages, attempt = 0) {
    if (attempt >= MODELS.length) {
      throw new Error('All models exhausted. Check your API key or try again later.');
    }

    const model = MODELS[(activeModelIndex + attempt) % MODELS.length];

    const body = {
      model: model.id,
      messages,
      temperature: 0.85,
      max_tokens: model.maxTokens,
    };

    let response;
    try {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      throw new Error('Network error. Check your connection.');
    }

    // Rate limit or server error → try next model
    if (response.status === 429 || response.status === 503 || response.status === 502) {
      console.warn(`[PH.ai] Model ${model.name} unavailable (${response.status}), trying next...`);
      return callGroq(messages, attempt + 1);
    }

    if (response.status === 401) {
      throw new Error('Invalid API key. Please update GROQ_API_KEY in utils/ai.js');
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      // Try next model for any server-side error
      if (attempt < MODELS.length - 1) {
        console.warn(`[PH.ai] Model ${model.name} error (${response.status}), trying next...`);
        return callGroq(messages, attempt + 1);
      }
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI. Please try again.');
    }

    lastUsedModel = model.name;
    // Prefer the working model for next call
    activeModelIndex = (activeModelIndex + attempt) % MODELS.length;

    return { content, model: model.name };
  }

  // Parse JSON safely from AI response — handles markdown code fences
  function parseJSON(text) {
    let clean = text.trim();
    // Strip markdown fences if present
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    // Find first { and last } to extract JSON object
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in response');
    clean = clean.slice(start, end + 1);
    return JSON.parse(clean);
  }

  // Generate full project idea
  async function generateProjectIdea({ category, difficulty, techStack }) {
    const systemPrompt = `You are a senior software architect and product designer. 
Generate creative, technically sound, and actually buildable project ideas.
You MUST respond with a valid JSON object only — no preamble, no explanation, no markdown.
Every string field must be filled. Every array must have at least 3 items.`;

    const userPrompt = `Generate a unique project idea with these constraints:
- Category: ${category}
- Difficulty: ${difficulty}
- Preferred Tech Stack: ${techStack.length ? techStack.join(', ') : 'Developer\'s choice'}

Return ONLY a JSON object with this exact structure:
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
  "buildTime": "X hours / X days / X weeks",
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

  // Generate GitHub artifacts (README, folder structure, .gitignore)
  async function generateGithubArtifacts(project) {
    const systemPrompt = `You are an expert open-source developer. 
Generate production-quality GitHub repository artifacts.
You MUST respond with a valid JSON object only — no preamble, no markdown outside the JSON values.`;

    const userPrompt = `Generate GitHub repository artifacts for this project:
Title: ${project.title}
Description: ${project.tagline}
Tech Stack: ${project.techStack.join(', ')}
Difficulty: ${project.difficulty}

Return ONLY a JSON object with this exact structure:
{
  "readme": "Full README.md content as a string (use \\n for newlines, include badges, sections: Description, Features, Tech Stack, Getting Started, Installation, Usage, Contributing, License)",
  "folderStructure": "ASCII folder tree as a string (use \\n for newlines, realistic for the tech stack)",
  "gitignore": "Complete .gitignore content for the tech stack (use \\n for newlines)"
}

The README should be comprehensive and professional. Include installation commands specific to the tech stack.
The folder structure should be realistic — 15-25 files/folders shown.
The .gitignore should cover all relevant patterns for ${project.techStack.join(', ')}.`;

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
