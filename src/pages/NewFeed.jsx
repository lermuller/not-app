import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { CATEGORIES, PORTALS } from '../tokens'
import { saveFeed, generateId } from '../utils/storage'

const TOPIC_ORDER = ['all', 'sports', 'politics', 'news', 'tech', 'business']

export default function NewFeed() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [selectedPortals, setSelectedPortals] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [building, setBuilding] = useState(false)

  const togglePortal = (id) => {
    setSelectedPortals(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const activeTheme = selectedCategory ? CATEGORIES[selectedCategory] : null

  const canBuild = name.trim().length > 0 && selectedPortals.length > 0 && selectedCategory

  const handleBuild = () => {
    if (!canBuild) return
    setBuilding(true)
    const feed = {
      id: generateId(),
      name: name.trim(),
      portals: selectedPortals,
      category: selectedCategory,
      createdAt: new Date().toISOString(),
    }
    saveFeed(feed)
    setTimeout(() => navigate(`/feed/${feed.id}`), 300)
  }

  const chipBase = {
    fontFamily: "'Archiv Grotesk', sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    padding: '9px 16px',
    borderRadius: '20px',
    border: '1px solid #E0DDD8',
    background: '#FFFFFF',
    color: '#1F1B1D',
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '-0.1px',
  }

  return (
    <div className="app-shell">
      <Header />
      <div style={{ padding: '20px 16px 100px', flex: 1, overflowY: 'auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '18px', color: '#1F1B1D', marginBottom: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ←
        </button>

        <h1 style={{
          fontFamily: "'Archiv Grotesk', sans-serif",
          fontSize: '28px',
          fontWeight: 700,
          color: '#1F1B1D',
          letterSpacing: '-0.8px',
          marginBottom: '24px',
          lineHeight: 1.1,
        }}>
          New feed
        </h1>

        {/* Name input */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            color: '#888580',
            display: 'block',
            marginBottom: '6px',
          }}>
            Name:
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My sports feed..."
            maxLength={32}
            style={{
              width: '100%',
              fontFamily: "'Archiv Grotesk', sans-serif",
              fontSize: '15px',
              fontWeight: 500,
              color: '#1F1B1D',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #1F1B1D',
              padding: '6px 0',
              outline: 'none',
            }}
          />
        </div>

        {/* Portal selection */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            color: '#888580',
            marginBottom: '10px',
          }}>
            Choose the News portal:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.values(PORTALS).map(portal => {
              const active = selectedPortals.includes(portal.id)
              return (
                <button
                  key={portal.id}
                  onClick={() => togglePortal(portal.id)}
                  style={{
                    ...chipBase,
                    background: active ? '#1F1B1D' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#1F1B1D',
                    borderColor: active ? '#1F1B1D' : '#E0DDD8',
                  }}
                >
                  {portal.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Topic selection */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            color: '#888580',
            marginBottom: '10px',
          }}>
            What would be topics?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {TOPIC_ORDER.map(catId => {
              const cat = CATEGORIES[catId]
              const active = selectedCategory === catId
              return (
                <button
                  key={catId}
                  onClick={() => setSelectedCategory(catId)}
                  style={{
                    ...chipBase,
                    background: active ? cat.primary : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#1F1B1D',
                    borderColor: active ? cat.primary : '#E0DDD8',
                    borderRadius: active ? cat.radius : '20px',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Build button */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '390px', padding: '12px 16px 24px', background: 'linear-gradient(transparent, #F5F4EF 30%)' }}>
        <button
          onClick={handleBuild}
          disabled={!canBuild || building}
          style={{
            width: '100%',
            padding: '16px',
            fontFamily: "'Archiv Grotesk', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.2px',
            background: canBuild ? (activeTheme?.primary || '#1F1B1D') : '#E0DDD8',
            color: canBuild ? '#FFFFFF' : '#AAA8A4',
            border: 'none',
            borderRadius: activeTheme?.radius || '1px',
            cursor: canBuild ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {building ? 'Building...' : 'Build'}
        </button>
      </div>
    </div>
  )
}
