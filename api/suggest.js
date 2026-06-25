import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { behavior } = req.body

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const behaviorText = Object.entries(behavior)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `${cat}: ${count} opens`)
    .join(', ')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Baseado no padrão de uso (${behaviorText}), sugira um nome criativo e curto para um feed de notícias e as categorias dominantes. Retorne APENAS JSON válido sem markdown: {"name": "string", "description": "string de 1 linha", "categories": ["category_id1", "category_id2"]}. Os category_ids válidos são: all, sports, politics, news, tech, business.`,
    }],
  })

  const text = response.content[0].text.replace(/```json|```/g, '').trim()
  res.json(JSON.parse(text))
}
