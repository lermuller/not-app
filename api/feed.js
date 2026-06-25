import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: '__cdata',
  textNodeName: '_text',
})

function decodeEntities(str = '') {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, ''')
    .replace(/&lsquo;/g, ''')
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
}

function extractText(field) {
  if (!field) return ''
  if (typeof field === 'string') return decodeEntities(field.trim())
  if (field.__cdata) return decodeEntities(field.__cdata.trim())
  if (field._text) return decodeEntities(String(field._text).trim())
  return decodeEntities(String(field).trim())
}

function stripHtml(str = '') {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url, count = '15' } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url param' })

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; notapp/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const xml = await response.text()

    const parsed = parser.parse(xml)
    const channel = parsed?.rss?.channel || parsed?.feed || {}
    const rawItems = channel.item || channel.entry || []
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]

    const results = items.slice(0, parseInt(count)).map(item => {
      const rawDesc = extractText(item.description || item.summary || item.content || '')
      const description = stripHtml(rawDesc).replace(/\s+/g, ' ').trim()

      return {
        id: extractText(item.guid || item.id || item.link),
        title: extractText(item.title),
        link: extractText(item.link?.['@_href'] || item.link),
        description: description.length > 10 ? description.slice(0, 160) : null,
        pubDate: extractText(item.pubDate || item.published || item.updated),
        thumbnail: item['media:thumbnail']?.['@_url'] || item['media:content']?.['@_url'] || null,
      }
    })

    res.json({ status: 'ok', items: results, feedTitle: extractText(channel.title) })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}
