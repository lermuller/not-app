import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import NewsCard from '../components/NewsCard'
import { CATEGORIES, PORTALS } from '../tokens'
import { getFeeds, deleteFeed, trackOpen, getLivingFeedConfig } from '../utils/storage'
import { fetchMultipleFeeds } from '../utils/rss'

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
            const url = portal.feeds[f.category] || portal.feeds.all
            if (!url) return
            sources.push({ url, portalName: portal.name, category: f.category })
          })
        })
      } else {
        const config = getLivingFeedConfig()
        config.portals.forEach(portalId => {
          const portal = PORTALS[portalId]
          if (!portal) return
          const url = portal.feeds[config.primaryCategory] || portal.feeds.all
          if (!url) return
          sources.push({ url, portalName: portal.name, category: config.primaryCategory })
        })
      }

      const config = getLivingFeedConfig()
      const virtualFeed = {
        id: 'living',
        name: 'Para você',
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

  async function filterByCategory(items, category) {
    if (!category || category === 'all' || items.length === 0) return items
    setFiltering(true)
    try {
      const res = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          articles: items.map(item => ({ title: item.title })),
        }),
      })
      const data = await res.json()
      const filtered = data.indices.map(i => items[i]).filter(Boolean)
      return filtered.length > 0 ? filtered : items
    } catch {
      return items
    } finally {
      setFiltering(false)
    }
  }

  function loadFeed(feedData, count) {
    const sources = feedData.portals
      .map(portalId => {
        const portal = PORTALS[portalId]
        if (!portal) return null
        const url = portal.feeds[feedData.category] || portal.feeds.all
        if (!url) return null
        return { url, portalName: portal.name }
      })
      .filter(Boolean)

    fetchMultipleFeeds(sources, count)
      .then(async data => {
        setLoading(false)
        const filtered = await filterByCategory(data, feedData.category)
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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h1 style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '24px', fontWeight: 700, color: isLiving ? '#FFFFFF' : '#1F1B1D', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
            {feed.name}
          </h1>
          {isLiving ? (
            <div style={{ display: 'flex', gap: '4px', marginBottom: '2px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {(feed.categories || []).map(catId => {
                const cat = CATEGORIES[catId]
                return cat ? (
                  <span key={catId} style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: '20px' }}>
                    {cat.labelPT}
                  </span>
                ) : null
              })}
            </div>
          ) : (
            <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', background: theme.primary, color: '#FFFFFF', padding: '3px 9px', borderRadius: theme.radius, flexShrink: 0, marginLeft: '8px', marginBottom: '2px' }}>
              {theme.labelPT}
            </span>
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
              {filtering ? `Filtering for ${theme.labelPT}...` : 'Loading feed...'}
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
              onArticleClick={isLiving ? (cat) => { if (cat) trackOpen(cat) } : null}
            />
          )
        })}

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
