import Anthropic from '@anthropic-ai/sdk'

const CATEGORY_DESC = {
  sports:   'Esportes, futebol, basquete, tênis, atletismo, campeonatos, times, atletas — Sports, football, basketball, tennis, athletes, championships',
  tech:     'Tecnologia, inteligência artificial, software, startups, produtos digitais, ciência da computação — Technology, AI, software, startups, digital products',
  business: 'Negócios, economia, mercado financeiro, empresas, investimentos, inflação, PIB, bolsa de valores — Business, economy, finance, market, companies, investments',
  politics: 'Política, governo, eleições, partidos, legislação, congresso, ministérios — Politics, government, elections, legislation, congress',
  news:     'Atualidades gerais, acontecimentos do dia — General current events, daily news',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { category, articles } = req.body
  if (!category || category === 'all' || !articles?.length) {
    return res.json({ indices: articles.map((_, i) => i) })
  }

  const desc = CATEGORY_DESC[category]
  if (!desc) return res.json({ indices: articles.map((_, i) => i) })

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const articleList = articles
      .map((a, i) => `${i}. ${a.title}`)
      .join('\n')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Filter news articles. Keep ONLY articles clearly about: ${desc}

Exclude anything that is about other topics, even if from the same portal.

Articles:
${articleList}

Reply ONLY with a JSON array of the indices to keep. Example: [0,2,5]
If none match, return: []`,
      }],
    })

    const text = response.content[0].text.trim()
    const match = text.match(/\[[\d,\s]*\]/)
    const indices = match ? JSON.parse(match[0]) : articles.map((_, i) => i)
    res.json({ indices })
  } catch {
    // Fallback: return all indices if filtering fails
    res.json({ indices: articles.map((_, i) => i) })
  }
}
