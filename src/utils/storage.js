const FEEDS_KEY = 'notapp_feeds'
const BEHAVIOR_KEY = 'notapp_behavior'

export function getFeeds() {
  try { return JSON.parse(localStorage.getItem(FEEDS_KEY) || '[]') }
  catch { return [] }
}

export function saveFeed(feed) {
  const feeds = getFeeds()
  feeds.push(feed)
  localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds))
  return feed
}

export function deleteFeed(id) {
  const feeds = getFeeds().filter(f => f.id !== id)
  localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds))
}

export function trackOpen(category) {
  const b = getBehavior()
  b[category] = (b[category] || 0) + 1
  localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(b))
}

export function getBehavior() {
  try { return JSON.parse(localStorage.getItem(BEHAVIOR_KEY) || '{}') }
  catch { return {} }
}

export function getDominantCategories() {
  const b = getBehavior()
  const total = Object.values(b).reduce((a, c) => a + c, 0)
  if (total < 4) return null
  return Object.entries(b)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat)
}

export function generateId() {
  return `feed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}
