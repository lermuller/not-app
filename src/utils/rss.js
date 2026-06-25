function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

export async function fetchFeed(url, portalName, count = 15, category = null) {
  const encoded = encodeURIComponent(url)
  const res = await fetch(`/api/feed?url=${encoded}&count=${count}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || 'Feed error')
  return data.items.map(item => ({
    id: item.id || item.link,
    title: item.title?.trim() || 'Sem título',
    link: item.link,
    description: stripHtml(item.description || '').slice(0, 140),
    pubDate: item.pubDate,
    thumbnail: item.thumbnail || null,
    portalName,
    itemCategory: category,
  }))
}

export async function fetchMultipleFeeds(sources, count = 15) {
  const results = await Promise.allSettled(
    sources.map(({ url, portalName, category }) => fetchFeed(url, portalName, count, category))
  )
  const items = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
  return items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}
