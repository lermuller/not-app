import Anthropic from '@anthropic-ai/sdk'

const CATEGORY_DESC = {
  sports:   'Sports, athletics, football, basketball, tennis, championships, athletes, teams, games, tournaments',
  tech:     'Technology, AI, software, startups, digital products, computing, internet, apps',
  business: 'Business, economy, finance, companies, investments, market, stock exchange, GDP, startups, industry, commerce',
  politics: 'Politics, government, elections, parties, legislation, congress, president, ministers',
  news:     'General current events, daily news',
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

    let prompt = `You are a strict news filter. Be conservative — when in doubt, EXCLUDE.\n\n`

    if (hasCategory) {
      prompt += `TOPIC RULE: Keep ONLY articles clearly about: ${CATEGORY_DESC[category]}
EXCLUDE: articles about other topics even if tangentially related.\n\n`
    }

    if (hasLocation) {
      const hints = locationKeywords.slice(0, 12).join(', ')
      prompt += `LOCATION RULE: Keep ONLY articles about events PHYSICALLY HAPPENING IN or DIRECTLY ADMINISTERED BY "${location}".
Location keywords: ${hints}

EXCLUDE these types even if they mention the city:
- National/federal policy news (central bank, federal agencies, national prices)
- International news (foreign governments, global markets, US/Europe events)
- Companies "based in" the city doing business elsewhere
- Global commodity prices (oil, currency, interest rates set nationally)
- Stories where the city is just context, not the subject

INCLUDE only:
- Events that happened IN the city (local incidents, local announcements)
- Local government actions (city hall, city council, state government of that city)
- Local infrastructure, transport, services specific to that city
- Local business news about that city's economy specifically\n\n`
    }

    prompt += `Articles to evaluate:
${articles.map((a, i) => `${i}. ${a.title}`).join('\n')}

Return ONLY a JSON array of indices to KEEP. Be strict. If unsure, exclude.
Example: [1, 3, 5]
If nothing qualifies: []`

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
    res.status(500).json({ error: err.message, indices: [] })
  }
}
