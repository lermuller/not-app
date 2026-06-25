import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import NewsCard from '../components/NewsCard'
import { CATEGORIES, PORTALS } from '../tokens'
import { getFeeds, trackOpen } from '../utils/storage'
import { fetchMultipleFeeds } from '../utils/rss'

export default function FeedView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [feed, setFeed] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [briefing, setBriefing] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)

  const theme = feed ? (CATEGORIES[feed.category] || CATEGORIES.all) : CATEGORIES.all

  useEffect(() => {
    const found = getFeeds().find(f => f.id === id)
    if (!found) { navigate('/'); return }
    setFeed(found)
    trackOpen(found.category)

    const sources = found.portals
      .map(portalId => {
        const portal = PORTALS[portalId]
        if (!portal) return null
        const url = portal.feeds[found.category] || portal.feeds.all
        if (!url) return null
        return { url, portalName: portal.name }
      })
      .filter(Boolean)

    fetchMultipleFeeds(sources)
      .then(data => { setItems(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id])

  const handleBriefing = async () => {
    if (!items.length || loadingBrief) return
    setLoadingBrief(true)
    setBriefing(null)
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedName: feed.name,
          category: theme.labelPT,
          items: items.slice(0, 15).map(i => ({ title: i.title, portalName: i.portalName })),
        }),
      })
      const data = await res.json()
      setBriefing(data.briefing)
    } catch {
      setBriefing('Não foi possível gerar o briefing agora.')
    } finally {
      setLoadingBrief(false)
    }
  }

  if (!feed) return null

  return (
    <div className="app-shell">
      <Header />

      {/* Feed header */}
      <div style={{ padding: '16px 16px 0', background: '#F5F4EF' }}>
        <button
          onClick={() => navigate('/')}
          style={{ fontSize: '18px', color: '#1F1B1D', marginBottom: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ←
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h1 style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            color: '#1F1B1D',
            letterSpacing: '-0.6px',
            lineHeight: 1.1,
          }}>
            {feed.name}
          </h1>
          <span style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            background: theme.primary,
            color: '#FFFFFF',
            padding: '3px 9px',
            borderRadius: theme.radius,
            flexShrink: 0,
            marginLeft: '8px',
            marginBottom: '2px',
          }}>
            {theme.labelPT}
          </span>
        </div>
        <div style={{ height: '2px', background: theme.primary, borderRadius: theme.radius, marginBottom: '0' }} />
      </div>

      {/* AI briefing banner */}
      <div style={{ padding: '10px 12px 0' }}>
        <button
          onClick={handleBriefing}
          disabled={loadingBrief || loading}
          style={{
            width: '100%',
            background: '#1F1B1D',
            borderRadius: theme.radius,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: 'none',
            cursor: loadingBrief ? 'wait' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: theme.primary, fontSize: '14px' }}>✦</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 600, color: '#FFFFFF' }}>
                {loadingBrief ? 'Generating briefing...' : 'AI briefing'}
              </p>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                {loading ? 'loading feed...' : `${items.length} items today`}
              </p>
            </div>
          </div>
          <span style={{ color: theme.primary, fontSize: '12px' }}>→</span>
        </button>
      </div>

      {/* Briefing result */}
      {briefing && (
        <div style={{ margin: '8px 12px 0', padding: '12px 14px', background: '#1F1B1D', borderRadius: theme.radius, borderTop: `2px solid ${theme.primary}` }}>
          <p style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
            {briefing}
          </p>
          <button
            onClick={() => setBriefing(null)}
            style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            close ×
          </button>
        </div>
      )}

      {/* Section label */}
      <p style={{
        fontFamily: "'Archiv Grotesk', sans-serif",
        fontSize: '9px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#AAA8A4',
        padding: '12px 12px 4px',
      }}>
        Latest
      </p>

      {/* Feed list */}
      <div style={{ padding: '0 12px 32px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {loading && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', color: '#AAA8A4' }}>Loading feed...</p>
          </div>
        )}
        {error && !loading && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', color: '#E05252' }}>Could not load feed. Check your connection.</p>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', color: '#AAA8A4' }}>No items found.</p>
          </div>
        )}
        {items.map(item => (
          <NewsCard key={item.id} item={item} theme={theme} />
        ))}
      </div>
    </div>
  )
}
