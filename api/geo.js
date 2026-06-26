import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { location } = req.body
  if (!location) return res.status(400).json({ error: 'Missing location' })

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate keywords to identify news articles about events happening IN "${location}".

Include: city name variations, local government names (prefeitura, câmara municipal), neighborhoods, major local institutions, abbreviations, gentilics (ex: paulistano, carioca), local landmarks and transport.

Be specific — prefer terms unique to this location. Aim for 15-20 keywords.

Return ONLY valid JSON, no markdown: {"keywords": ["...", "..."]}`,
      }],
    })

    const text = response.content[0].text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(text)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
