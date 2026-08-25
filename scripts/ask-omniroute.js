const BASE_URL = process.env.OMNIROUTE_VSCODE_URL || 'http://localhost:20128/api/v1/vscode/sk-d3f7200b496617a9-48ec87-048b8080';
const API_KEY = process.env.OMNIROUTE_API_KEY || 'sk-d3f7200b496617a9-48ec87-048b8080';

export async function askOmniRoute(prompt, model = 'auto/best-coding') {
  const url = `${BASE_URL}/chat/completions`;
  
  const payload = JSON.stringify({
    model,
    stream: false,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json'
    },
    body: payload
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OmniRoute error (${response.status}): ${errText}`);
  }

  const rawText = await response.text();

  // Try parsing as standard JSON first
  try {
    const json = JSON.parse(rawText);
    if (json.choices?.[0]?.message?.content) {
      return json.choices[0].message.content;
    }
  } catch {
    // If not JSON, it is SSE stream (data: {...})
  }

  // Parse SSE stream format
  const lines = rawText.split('\n');
  let accumulatedContent = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('data: ')) {
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') break;
      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
        accumulatedContent += delta;
      } catch {
        // Skip unparseable lines
      }
    }
  }

  return accumulatedContent.trim() || rawText;
}

// If run directly from terminal:
const args = process.argv.slice(2);
if (args.length > 0) {
  const prompt = args[0];
  const model = args[1] || 'auto/best-coding';
  console.log(`[OmniRoute] Querying model '${model}'...`);
  askOmniRoute(prompt, model)
    .then((reply) => {
      console.log('\n--- Model Response ---\n');
      console.log(reply);
    })
    .catch((err) => {
      console.error('[OmniRoute Error]:', err.message);
    });
}
