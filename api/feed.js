import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  cdataPropName: '__cdata',
  textNodeName: '_text',
})

function decodeEntities(str) {
  if (!str) return ''
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
}

function extractText(field) {
  if (!field) return ''
  if (typeof field === 'string') return decodeEntities(field.trim())
  if (field.__cdata) return decodeEntities(field.__cdata.trim())
  if (field._text) return decodeEntities(String(field._text).trim())
  return decodeEntities(String(field).trim())
}

function stripHtml(str) {
  if (!str) return ''
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url, count = '15' } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url param' })

  try {
    const response = await fetchWithTimeout(
      decodeURIComponent(url),
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      8000
    )
    if (!response.ok) throw new Error('HTTP ' + response.status)
    const xml = await response.text()

    const parsed = parser.parse(xml)
    const channel = parsed?.rss?.channel || parsed?.feed || {}
    const rawItems = channel.item || channel.entry || []
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]

    const results = items.slice(0, parseInt(count, 10)).map(function(item) {
      const rawDesc = extractText(item.description || item.summary || item.content || '')
      const description = stripHtml(rawDesc).replace(/\s+/g, ' ').trim()
      const link = item.link
      const linkStr = typeof link === 'object' ? (link['@_href'] || '') : extractText(link)

      return {
        id: extractText(item.guid || item.id) || linkStr,
        title: extractText(item.title),
        link: linkStr,
        description: description.length > 10 ? description.slice(0, 160) : null,
        pubDate: extractText(item.pubDate || item.published || item.updated),
        thumbnail: (item['media:thumbnail'] && item['media:thumbnail']['@_url']) ||
                   (item['media:content'] && item['media:content']['@_url']) || null,
      }
    })

    res.json({ status: 'ok', items: results, feedTitle: extractText(channel.title) })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}
