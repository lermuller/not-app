import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import NewsCard from '../components/NewsCard'
import { CATEGORIES, PORTALS } from '../tokens'
import { getFeeds, deleteFeed, trackOpen, getLivingFeedConfig } from '../utils/storage'
import { fetchMultipleFeeds } from '../utils/rss'
import { prepareInstall, detectPlatform, isAlreadyInstalled } from '../utils/pwa'
import { getCityById } from '../utils/cities'

function renderBold(text) {
  if (!text) return null
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ fontWeight: 700, color: '#FFFFFF' }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

function getLivingGradient(categories) {
  if (!categories || categories.length === 0)
    return 'linear-gradient(135deg, #1AA275 0%, #167BFF 50%, #8F3AF6 100%)'
  const colors = categories.slice(0, 2).map(c => CATEGORIES[c]?.primary).filter(Boolean)
  if (colors.length === 1) return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]}99 100%)`
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
}

const INITIAL_COUNT = 15
const LOAD_MORE_COUNT = 15

export default function FeedView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [feed, setFeed] = useState(null)
  const [allItems, setAllItems] = useState([])
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [briefing, setBriefing] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [filtering, setFiltering] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [excludedCount, setExcludedCount] = useState(0)

  const isLiving = id === 'living'
  const theme = feed ? (CATEGORIES[feed.category] || CATEGORIES.all) : CATEGORIES.all
  const visibleItems = allItems.slice(0, displayCount)
  const hasMore = displayCount < allItems.length

  useEffect(() => {
    if (isLiving) {
      const allFeeds = getFeeds()
      const sources = []
      const seen = new Set()

      if (allFeeds.length > 0) {
        allFeeds.forEach(f => {
          f.portals.forEach(portalId => {
            const key = `${portalId}-${f.category}`
            if (seen.has(key)) return
            seen.add(key)
            const portal = PORTALS[portalId]
            if (!portal) return
            const specificUrl = portal.feeds[f.category]
            const fallbackUrl = portal.feeds.all
            const url = specificUrl || fallbackUrl
            if (!url) return
            // Only tag with category if we have a specific feed for it
            // Otherwise tag as null so cards don't show a wrong category badge
            const category = specificUrl ? f.category : null
            sources.push({ url, portalName: portal.name, category })
          })
        })
      } else {
        const config = getLivingFeedConfig()
        config.portals.forEach(portalId => {
          const portal = PORTALS[portalId]
          if (!portal) return
          const specificUrl = portal.feeds[config.primaryCategory]
          const url = specificUrl || portal.feeds.all
          if (!url) return
          const category = specificUrl ? config.primaryCategory : null
          sources.push({ url, portalName: portal.name, category })
        })
      }

      const config = getLivingFeedConfig()
      const virtualFeed = {
        id: 'living',
        name: 'Living Feed',
        portals: [...new Set(allFeeds.flatMap(f => f.portals))],
        category: config.primaryCategory || 'all',
        categories: config.categories,
        isLiving: true,
      }
      setFeed(virtualFeed)
      fetchMultipleFeeds(sources, 20)
        .then(data => { setAllItems(data); setLoading(false) })
        .catch(err => { setError(err.message); setLoading(false) })
      return
    }

    const found = getFeeds().find(f => f.id === id)
    if (!found) { navigate('/'); return }
    setFeed(found)
    trackOpen(found.category)
    loadFeed(found, 30)
  }, [id])

  useEffect(() => {
    setInstalled(isAlreadyInstalled())
  }, [])

  const handleInstall = () => {
    prepareInstall(feed, theme)
    setShowInstallModal(true)
  }

  // Layer 1: fast client-side keyword pre-filter
  function keywordPreFilter(items, locationKeywords) {
    if (!locationKeywords?.length) return { pass: items, fail: [] }
    const lower = locationKeywords.map(k => k.toLowerCase())
    const pass = []
    const fail = []
    items.forEach(item => {
      const text = (item.title + ' ' + (item.description || '')).toLowerCase()
      // Allow all keywords regardless of length — "SP", "RJ", "BH" are valid 2-char codes
      const hit = lower.some(kw => {
        if (kw.length < 2) return false
        // For short keywords (2-3 chars), require word boundary to avoid false matches
        if (kw.length <= 3) {
          return new RegExp(`\\b${kw}\\b`, 'i').test(text)
        }
        return text.includes(kw)
      })
      ;(hit ? pass : fail).push(item)
    })
    return { pass, fail }
  }

  // Layer 2: Claude semantic validation
  async function claudeFilter(items, category, location, locationKeywords) {
    if (items.length === 0) return []
    try {
      const res = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          location: location || null,
          locationKeywords: locationKeywords || [],
          articles: items.map(item => ({ title: item.title, description: item.description })),
        }),
      })
      if (!res.ok) return items // API error: keep keyword-matched items
      const data = await res.json()
      if (!Array.isArray(data.indices)) return items
      const filtered = data.indices.map(i => items[i]).filter(Boolean)
      return filtered // return empty if Claude says nothing qualifies — don't fall back
    } catch {
      return items // network error: keep at least keyword-matched items
    }
  }

  async function filterByCategory(items, feedData) {
    const { category, location, locationKeywords } = feedData
    const hasCategory = category && category !== 'all'
    const hasLocation = location && locationKeywords?.length > 0

    if (!hasCategory && !hasLocation) return items
    if (items.length === 0) return items

    setFiltering(true)
    try {
      let toFilter = items
      let excluded = 0

      // Layer 1: keyword pre-filter for location (fast, no API)
      if (hasLocation) {
        const { pass, fail } = keywordPreFilter(items, locationKeywords)
        toFilter = pass
        excluded += fail.length
      }

      // Layer 2: Claude semantic validation
      const result = await claudeFilter(toFilter, hasCategory ? category : null, location, locationKeywords)
      excluded += toFilter.length - result.length

      setExcludedCount(excluded)
      return result
    } finally {
      setFiltering(false)
    }
  }

  function loadFeed(feedData, count) {
    const city = feedData.cityId ? getCityById(feedData.cityId) : null
    const sources = feedData.portals
      .map(portalId => {
        const portal = PORTALS[portalId]
        if (!portal) return null
        // Use city-specific feed override if available — much more accurate than filtering
        const cityOverride = city?.feedOverrides?.[portalId]
        const url = cityOverride || portal.feeds[feedData.category] || portal.feeds.all
        if (!url) return null
        return { url, portalName: portal.name }
      })
      .filter(Boolean)

    fetchMultipleFeeds(sources, count)
      .then(async data => {
        setLoading(false)
        const filtered = await filterByCategory(data, feedData)
        setAllItems(filtered)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }

  const handleLoadMore = async () => {
    if (hasMore) {
      setDisplayCount(c => c + LOAD_MORE_COUNT)
      return
    }
    // Fetch a fresh batch with higher count if we've shown everything
    setLoadingMore(true)
    const sources = feed.portals
      .map(portalId => {
        const portal = PORTALS[portalId]
        if (!portal) return null
        const url = portal.feeds[feed.category] || portal.feeds.all
        if (!url) return null
        return { url, portalName: portal.name }
      })
      .filter(Boolean)

    try {
      const data = await fetchMultipleFeeds(sources, allItems.length + 20)
      setAllItems(data)
      setDisplayCount(data.length)
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false)
    }
  }

  const handleBriefing = async () => {
    if (!allItems.length || loadingBrief) return
    setLoadingBrief(true)
    setBriefing(null)
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedName: feed.name,
          category: theme.labelPT,
          items: visibleItems.slice(0, 15).map(i => ({ title: i.title, portalName: i.portalName })),
        }),
      })
      const data = await res.json()
      setBriefing(data.briefing)
    } catch {
      setBriefing('Could not generate briefing right now.')
    } finally {
      setLoadingBrief(false)
    }
  }

  const handleDeleteConfirm = () => {
    deleteFeed(id)
    navigate('/')
  }

  if (!feed) return null

  return (
    <div className="app-shell">
      <Header />

      {/* Install modal */}
      {showInstallModal && feed && (
        <div onClick={() => setShowInstallModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '390px', background: '#FAFAFA', padding: '24px 20px 36px', borderRadius: '10px 10px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: theme.radius, background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </div>
              <div>
                <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '15px', fontWeight: 700, color: '#1F1B1D', letterSpacing: '-0.3px' }}>
                  Add "{feed.name}" to your home screen
                </p>
              </div>
            </div>

            {detectPlatform() === 'ios' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {[
                  { n: '1', text: 'Tap the Share button', detail: 'the ↑ icon at the bottom of Safari' },
                  { n: '2', text: 'Select "Add to Home Screen"', detail: 'scroll down in the share sheet' },
                  { n: '3', text: 'Tap "Add"', detail: `the app will appear as "${feed.name}"` },
                ].map(step => (
                  <div key={step.n} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{step.n}</div>
                    <div>
                      <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1F1B1D' }}>{step.text}</p>
                      <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', color: '#4A4745' }}>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : detectPlatform() === 'android' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {[
                  { n: '1', text: 'Tap the menu (⋮)', detail: 'top right corner of Chrome' },
                  { n: '2', text: 'Select "Add to Home Screen"', detail: 'or "Install app"' },
                  { n: '3', text: 'Confirm install', detail: `will appear as "${feed.name}"` },
                ].map(step => (
                  <div key={step.n} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{step.n}</div>
                    <div>
                      <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, color: '#1F1B1D' }}>{step.text}</p>
                      <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', color: '#4A4745' }}>{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '13px', color: '#4A4745', marginBottom: '20px', lineHeight: 1.6 }}>
                Open this page on your iPhone or Android and tap "Add to Home Screen" from the browser menu.
              </p>
            )}

            <button onClick={() => setShowInstallModal(false)} style={{ width: '100%', padding: '14px', fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '13px', fontWeight: 600, background: theme.primary, color: '#FFFFFF', border: 'none', borderRadius: theme.radius, cursor: 'pointer' }}>
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div
          onClick={() => setShowDeleteDialog(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '390px',
              background: '#F5F4EF',
              padding: '24px 20px 36px',
              borderRadius: '2px 2px 0 0',
            }}
          >
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '16px', fontWeight: 700, color: '#1F1B1D', marginBottom: '6px', letterSpacing: '-0.3px' }}>
              Delete &ldquo;{feed.name}&rdquo;?
            </p>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '13px', fontWeight: 400, color: '#4A4745', marginBottom: '20px' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  flex: 1, padding: '13px',
                  fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '13px', fontWeight: 600,
                  background: '#E05252', color: '#FFFFFF',
                  border: 'none', borderRadius: '1px', cursor: 'pointer',
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={{
                  flex: 1, padding: '13px',
                  fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '13px', fontWeight: 600,
                  background: '#FFFFFF', color: '#1F1B1D',
                  border: '1px solid #E0DDD8', borderRadius: '1px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-content">{/* Feed header */}
      <div style={{ padding: '16px 16px 0', background: isLiving ? getLivingGradient(feed?.categories) : '#FAFAFA' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <button onClick={() => navigate('/')} style={{ fontSize: '18px', color: isLiving ? 'rgba(255,255,255,0.9)' : '#1F1B1D', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!installed && feed && (
              <button
                onClick={handleInstall}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', fontWeight: 500,
                  color: isLiving ? 'rgba(255,255,255,0.8)' : '#4A4745',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>
                  <path d="M9 6h6"/>
                </svg>
                Add
              </button>
            )}
            {!isLiving && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: "'Archiv Grotesk', sans-serif",
                  fontSize: '13px', fontWeight: 500,
                  color: '#4A4745',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h1 style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, color: isLiving ? '#FFFFFF' : '#1F1B1D', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
            {feed.name}
          </h1>
          {isLiving ? (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '2px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[...new Set(allItems.map(i => i.itemCategory).filter(Boolean))].map(catId => {
                const cat = CATEGORIES[catId]
                return cat ? (
                  <span key={catId} style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: '20px' }}>
                    {cat.labelPT}
                  </span>
                ) : null
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginLeft: '8px', marginBottom: '2px', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', background: theme.primary, color: '#FFFFFF', padding: '3px 9px', borderRadius: theme.radius }}>
                {theme.labelPT}
              </span>
              {feed.location && (
                <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.08)', color: '#1F1B1D', padding: '3px 7px', borderRadius: theme.radius, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {feed.locationShort || feed.location.split(',')[0]}
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ height: '2px', background: isLiving ? 'rgba(255,255,255,0.3)' : theme.primary, borderRadius: isLiving ? '1px' : theme.radius }} />
      </div>

      {/* AI briefing banner */}
      <div style={{ padding: '10px 12px 0' }}>
        <button
          onClick={handleBriefing}
          disabled={loadingBrief || loading}
          style={{ width: '100%', background: '#1F1B1D', borderRadius: theme.radius, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: loadingBrief ? 'wait' : 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: theme.primary, fontSize: '14px' }}>✦</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 600, color: '#FFFFFF' }}>
                {loadingBrief ? 'Generating briefing...' : 'AI briefing'}
              </p>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                {loading ? 'loading...' : `${allItems.length} items`}
              </p>
            </div>
          </div>
          <span style={{ color: theme.primary, fontSize: '12px' }}>→</span>
        </button>
      </div>

      {/* Briefing result */}
      {briefing && (
        <div style={{ margin: '8px 12px 0', background: '#1F1B1D', borderRadius: theme.radius, borderTop: '2px solid ' + theme.primary, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px 0' }}>
            <button onClick={() => setBriefing(null)} style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>
              close ×
            </button>
          </div>
          <div style={{ padding: '4px 14px 14px' }}>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {renderBold(briefing)}
            </p>
          </div>
        </div>
      )}

      {/* Section label */}
      <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6966', padding: '12px 12px 4px' }}>
        Latest
      </p>

      {/* Feed list */}
      <div style={{ padding: '0 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(loading || filtering) && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', color: '#6B6966' }}>
              {filtering
                ? `Filtering${feed?.location ? ` for ${feed.location}` : ''}...`
                : 'Loading feed...'}
            </p>
          </div>
        )}
        {error && !loading && !filtering && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', color: '#E05252' }}>Could not load feed.</p>
          </div>
        )}
        {!loading && !filtering && !error && allItems.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', color: '#6B6966' }}>No items found.</p>
          </div>
        )}
        {!filtering && visibleItems.map(item => {
          const cardTheme = isLiving && item.itemCategory
            ? (CATEGORIES[item.itemCategory] || CATEGORIES.all)
            : theme
          return (
            <NewsCard
              key={item.id}
              item={item}
              theme={cardTheme}
              showCategoryTag={isLiving}
              geoTag={!isLiving && feed?.locationShort}
              onArticleClick={isLiving ? (cat) => { if (cat) trackOpen(cat) } : null}
            />
          )
        })}

        {/* Excluded count indicator */}
        {!loading && !filtering && excludedCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 2px', marginTop: '2px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6B6966" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '10px', color: '#6B6966' }}>
              {excludedCount} article{excludedCount !== 1 ? 's' : ''} excluded
              {feed?.location ? ` outside ${feed.locationShort || feed.location.split(',')[0]}` : ' by topic filter'}
            </span>
          </div>
        )}

        {/* Load more */}
        {!loading && !filtering && allItems.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              margin: '12px 0 32px',
              padding: '13px',
              width: '100%',
              fontFamily: "'Archiv Grotesk', sans-serif",
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              background: 'transparent',
              color: loadingMore ? '#6B6966' : '#1F1B1D',
              border: '1px solid ' + (loadingMore ? '#E0DDD8' : '#1F1B1D'),
              borderRadius: theme.radius,
              cursor: loadingMore ? 'wait' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {loadingMore ? 'Loading...' : hasMore ? `Load more (${allItems.length - displayCount} remaining)` : 'Load more'}
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
