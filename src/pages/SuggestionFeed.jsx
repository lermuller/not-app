import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { getBehavior, saveFeed, generateId } from '../utils/storage'
import { CATEGORIES } from '../tokens'

export default function SuggestionFeed() {
  const navigate = useNavigate()
  const [building, setBuilding] = useState(false)
  const [status, setStatus] = useState(null)

  const behavior = getBehavior()
  const totalOpens = Object.values(behavior).reduce((a, b) => a + b, 0)
  const hasEnoughData = totalOpens >= 4

  const topCategories = Object.entries(behavior)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => CATEGORIES[cat])
    .filter(Boolean)

  const handleBuild = async () => {
    if (building) return
    setBuilding(true)
    setStatus('Analyzing your reading pattern...')

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ behavior }),
      })
      const data = await res.json()
      setStatus('Creating feed...')

      const dominantCat = data.categories?.[0] || 'all'
      const feed = {
        id: generateId(),
        name: data.name || 'My Feed',
        portals: ['g1', 'cnn'],
        category: dominantCat,
        createdAt: new Date().toISOString(),
        isSuggested: true,
      }
      saveFeed(feed)
      setTimeout(() => navigate(`/feed/${feed.id}`), 400)
    } catch {
      // Fallback: create a feed based on local behavior
      const topCat = Object.entries(behavior).sort((a, b) => b[1] - a[1])[0]?.[0] || 'all'
      const theme = CATEGORIES[topCat] || CATEGORIES.all
      const feed = {
        id: generateId(),
        name: `My ${theme.labelPT} Feed`,
        portals: ['g1', 'cnn'],
        category: topCat,
        createdAt: new Date().toISOString(),
        isSuggested: true,
      }
      saveFeed(feed)
      setTimeout(() => navigate(`/feed/${feed.id}`), 400)
    }
  }

  return (
    <div className="app-shell">
      <Header />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 16px 100px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ fontSize: '18px', color: '#1F1B1D', marginBottom: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}
        >
          ←
        </button>

        <div style={{ background: '#1F1B1D', padding: '14px 16px', marginBottom: '16px' }}>
          <h1 style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.6px',
          }}>
            Suggestion Feed
          </h1>
        </div>

        {/* Info card */}
        <div style={{
          border: '1px solid #E0DDD8',
          borderRadius: '1px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '22px', marginBottom: '10px' }}>🤖</div>
          <p style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '13px',
            fontWeight: 400,
            color: '#888580',
            lineHeight: 1.6,
          }}>
            The suggestion feed uses your interaction and options used to create previous feeds to build a new, personalized one by machine.
          </p>
        </div>

        {/* Behavior preview */}
        {hasEnoughData && topCategories.length > 0 && (
          <div style={{ border: '1px solid #E0DDD8', borderRadius: '1px', padding: '14px', marginBottom: '16px' }}>
            <p style={{
              fontFamily: "'Archiv Grotesk', sans-serif",
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#AAA8A4',
              marginBottom: '10px',
            }}>
              Based on your activity
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              {topCategories.map(cat => (
                <span key={cat.id} style={{
                  fontFamily: "'Archiv Grotesk', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: cat.radius,
                  background: cat.primary,
                  color: '#FFFFFF',
                }}>
                  {cat.labelPT}
                </span>
              ))}
            </div>
          </div>
        )}

        {!hasEnoughData && (
          <div style={{ border: '1px solid #E0DDD8', borderRadius: '1px', padding: '14px' }}>
            <p style={{
              fontFamily: "'Archiv Grotesk', sans-serif",
              fontSize: '12px',
              color: '#AAA8A4',
              lineHeight: 1.6,
            }}>
              Open a few feeds first so we can learn your preferences. ({totalOpens}/4 interactions recorded)
            </p>
          </div>
        )}

        {status && (
          <p style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '11px',
            color: '#888580',
            marginTop: '12px',
            textAlign: 'center',
          }}>
            {status}
          </p>
        )}
      </div>

      {/* Build button */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '390px', padding: '12px 16px 24px', background: 'linear-gradient(transparent, #F5F4EF 30%)' }}>
        <button
          onClick={handleBuild}
          disabled={building}
          style={{
            width: '100%',
            padding: '16px',
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.2px',
            background: building ? '#888580' : '#1F1B1D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '1px',
            cursor: building ? 'wait' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {building ? 'Building...' : 'Build'}
        </button>
      </div>
    </div>
  )
}
