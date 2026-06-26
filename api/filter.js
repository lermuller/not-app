import Anthropic from '@anthropic-ai/sdk'

const CATEGORY_DESC = {
  sports:   'Esportes, futebol, basquete, tênis, atletismo, campeonatos, times, atletas — Sports, football, basketball, tennis, athletes',
  tech:     'Tecnologia, inteligência artificial, software, startups, produtos digitais — Technology, AI, software, startups, digital products',
  business: 'Negócios, economia, mercado financeiro, empresas, investimentos, inflação, PIB, bolsa — Business, economy, finance, market, investments',
  politics: 'Política, governo, eleições, partidos, legislação, congresso, ministérios — Politics, government, elections, legislation',
  news:     'Atualidades gerais, acontecimentos do dia — General current events',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { category, articles, location, locationKeywords } = req.body
  if (!articles?.length) return res.json({ indices: [] })

  const hasCategory = category && category !== 'all' && CATEGORY_DESC[category]
  const hasLocation = location && locationKeywords?.length > 0

  if (!hasCategory && !hasLocation) {
    return res.json({ indices: articles.map((_, i) => i) })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const criteria = []
    if (hasCategory) {
      criteria.push(`TOPIC — keep only articles about: ${CATEGORY_DESC[category]}`)
    }
    if (hasLocation) {
      const hints = locationKeywords.slice(0, 10).join(', ')
      criteria.push(`LOCATION — keep only articles about events happening IN "${location}" (hints: ${hints}). Exclude articles that merely mention the city without being about a local event.`)
    }

    const prompt = `Filter news articles. Keep ONLY articles matching ALL criteria below:

${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}

Articles:
${articles.map((a, i) => `${i}. ${a.title}`).join('\n')}

Reply ONLY with a JSON array of indices to keep. Example: [0,2,5]
If none match, return: []`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].text.trim()
    const match = text.match(/\[[\d,\s]*\]/)
    const indices = match ? JSON.parse(match[0]) : articles.map((_, i) => i)
    res.json({ indices })
  } catch {
    res.json({ indices: articles.map((_, i) => i) })
  }
}
