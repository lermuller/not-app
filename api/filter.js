import Anthropic from '@anthropic-ai/sdk'

const CATEGORY_DESC = {
  sports:   'Sports, athletics, football, basketball, tennis, championships, athletes, teams, games',
  tech:     'Technology, AI, software, startups, digital products, computing, internet, apps',
  business: 'Business, economy, finance, companies, investments, market, stock exchange, GDP, startups, industry',
  politics: 'Politics, government, elections, parties, legislation, congress, president, ministers',
  news:     'General current events, daily news',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { category, articles, location, locationKeywords } = req.body
  if (!articles?.length) return res.json({ indices: [] })

  const hasCategory = category && category !== 'all' && CATEGORY_DESC[category]
  const hasLocation = !!(location)

  if (!hasCategory && !hasLocation) {
    return res.json({ indices: articles.map((_, i) => i) })
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const articleList = articles
      .map((a, i) => {
        const desc = a.description ? ` — ${a.description.slice(0, 80)}` : ''
        return `${i}. ${a.title}${desc}`
      })
      .join('\n')

    let prompt = `You are a strict news filter. Analyze each article and return ONLY the indices that pass ALL rules below.\n\n`

    if (hasCategory) {
      prompt += `TOPIC RULE: Keep only articles clearly about: ${CATEGORY_DESC[category]}\n\n`
    }

    if (hasLocation) {
      const hints = (locationKeywords || []).slice(0, 8).join(', ')
      prompt += `LOCATION RULE: Keep only articles about events that PHYSICALLY HAPPENED IN "${location}".

INCLUDE: local government actions (city hall, city council), local infrastructure (metro, roads), local incidents, events organized in the city, local policy by city/state government.
EXCLUDE: national government decisions, international news, global market prices, articles where the city is just the company headquarters, federal agency decisions.
${hints ? `Local terms to recognize: ${hints}` : ''}\n\n`
    }

    prompt += `Articles:
${articleList}

Reply with ONLY a JSON array of indices to keep. Example: [0,2,4]
If none qualify: []`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].text.trim()
    const match = text.match(/\[[\d,\s]*\]/)
    const indices = match ? JSON.parse(match[0]) : []
    res.json({ indices })

  } catch (err) {
    // On error, return all indices so user sees something rather than nothing
    res.json({ indices: articles.map((_, i) => i), error: err.message })
  }
}
