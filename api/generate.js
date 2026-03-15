export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not set in environment variables.' });
  }

  const { model, messages, temperature, max_tokens } = req.body;

  if (!model || !messages) {
    return res.status(400).json({ error: 'Missing required fields: model, messages' });
  }

  let groqResponse;
  try {
    groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: temperature ?? 0.85, max_tokens: max_tokens ?? 4096 }),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Groq API. Check your network.' });
  }

  const data = await groqResponse.json();

  // Forward Groq's status code and response to the browser
  return res.status(groqResponse.status).json(data);
}