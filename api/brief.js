import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { feedName, category, items } = req.body

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const itemsList = items
    .map((item, i) => `${i + 1}. ${item.title} (${item.portalName})`)
    .join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Você é um curador de notícias. Crie um briefing conciso (3 parágrafos curtos) para o feed "${feedName}" de categoria "${category}" com base nestas notícias:

${itemsList}

Escreva em português brasileiro. Seja direto e informativo, sem saudações ou fechamentos. Destaque os acontecimentos mais relevantes.`,
    }],
  })

  res.json({ briefing: response.content[0].text })
}
