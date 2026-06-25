import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { getFeeds, deleteFeed } from '../utils/storage'
import { CATEGORIES } from '../tokens'

function FeedCard({ feed, onClick }) {
  const theme = CATEGORIES[feed.category] || CATEGORIES.all
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${theme.primary}`,
        borderRadius: '2px',
        padding: '14px',
        cursor: 'pointer',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '120px',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{
        height: '4px',
        background: theme.primary,
        borderRadius: theme.radius,
        width: '40px',
      }} />
      <span style={{
        fontFamily: "'Archiv Grotesk', sans-serif",
        fontSize: '13px',
        fontWeight: 700,
        color: '#1F1B1D',
        letterSpacing: '-0.2px',
        marginTop: 'auto',
      }}>
        {feed.name}
      </span>
      <span style={{
        fontFamily: "'Archiv Grotesk', sans-serif",
        fontSize: '10px',
        fontWeight: 400,
        color: '#AAA8A4',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {theme.labelPT}
      </span>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [feeds, setFeeds] = useState([])

  useEffect(() => {
    setFeeds(getFeeds())
  }, [])

  return (
    <div className="app-shell">
      <Header />
      <div style={{ padding: '24px 16px 32px', flex: 1 }}>
        <h1 style={{
          fontFamily: "'Archiv Grotesk', sans-serif",
          fontSize: '22px',
          fontWeight: 700,
          color: '#1F1B1D',
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          marginBottom: '6px',
        }}>
          Create your own<br />app feed.
        </h1>
        <p style={{
          fontFamily: "'Archiv Grotesk', sans-serif",
          fontSize: '13px',
          fontWeight: 300,
          color: '#888580',
          lineHeight: 1.6,
          marginBottom: '28px',
        }}>
          This is a challenge.<br />
          not for you. but for<br />
          the future of apps.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}>
          {feeds.map(feed => (
            <FeedCard
              key={feed.id}
              feed={feed}
              onClick={() => navigate(`/feed/${feed.id}`)}
            />
          ))}

          <div
            onClick={() => navigate('/new')}
            style={{
              border: '1px solid #E0DDD8',
              borderRadius: '2px',
              padding: '14px',
              cursor: 'pointer',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '120px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: '22px', color: '#C8C5C0', lineHeight: 1 }}>+</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', fontWeight: 600, color: '#1F1B1D' }}>Create</p>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 400, color: '#AAA8A4' }}>new feed</p>
            </div>
          </div>

          <div
            onClick={() => navigate('/suggestion')}
            style={{
              border: '1px solid #1F1B1D',
              borderRadius: '2px',
              padding: '14px',
              cursor: 'pointer',
              background: '#1F1B1D',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '120px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: '18px', color: '#FFFFFF', lineHeight: 1 }}>☆</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>Suggestion</p>
              <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>feed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
