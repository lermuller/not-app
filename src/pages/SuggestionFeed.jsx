import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { getBehavior, saveFeed, generateId } from '../utils/storage'
import { CATEGORIES } from '../tokens'

const RobotIcon = ({ size = 28, color = '#1F1B1D' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30.4748 16.76H28.9548V24.38H30.4748V16.76Z" fill={color}/>
    <path d="M28.9548 1.52002H27.4248V7.62002H28.9548V1.52002Z" fill={color}/>
    <path d="M27.4248 16.76H28.9548V15.24H27.4248V13.71H25.9048V28.95H27.4248V25.9H28.9548V24.38H27.4248V16.76Z" fill={color}/>
    <path d="M27.4248 7.62H25.9048V9.14H27.4248V7.62Z" fill={color}/>
    <path d="M27.4248 0H25.9048V1.52H27.4248V0Z" fill={color}/>
    <path d="M25.905 28.95H24.375V30.4799H25.905V28.95Z" fill={color}/>
    <path d="M25.905 12.1899H24.375V13.7099H25.905V12.1899Z" fill={color}/>
    <path d="M24.375 16.76H22.855V19.81H24.375V16.76Z" fill={color}/>
    <path d="M24.375 3.05005H22.855V6.09005H24.375V3.05005Z" fill={color}/>
    <path d="M24.375 30.48H7.61499V32H24.375V30.48Z" fill={color}/>
    <path d="M22.8549 15.24H19.8049V16.76H22.8549V15.24Z" fill={color}/>
    <path d="M22.855 6.08997H21.335V7.61997H22.855V6.08997Z" fill={color}/>
    <path d="M22.855 1.52002H21.335V3.05002H22.855V1.52002Z" fill={color}/>
    <path d="M22.8549 19.8101H19.8049V21.3301H22.8549V19.8101Z" fill={color}/>
    <path d="M10.6648 24.38V25.9H12.1848V27.43H13.7148V28.95H18.2848V27.43H19.8048V25.9H21.3348V24.38H10.6648Z" fill={color}/>
    <path d="M19.8049 16.76H18.2849V19.81H19.8049V16.76Z" fill={color}/>
    <path d="M13.7148 22.8601H18.2848V21.3301H16.7548V19.8101H15.2348V21.3301H13.7148V22.8601Z" fill={color}/>
    <path d="M13.7148 16.76H12.1848V19.81H13.7148V16.76Z" fill={color}/>
    <path d="M12.185 19.8101H9.14502V21.3301H12.185V19.8101Z" fill={color}/>
    <path d="M12.185 15.24H9.14502V16.76H12.185V15.24Z" fill={color}/>
    <path d="M24.375 12.19V10.67H16.755V7.62H18.285V6.09H19.805V1.52H18.285V0H13.715V1.52H12.185V6.09H13.715V7.62H15.235V10.67H7.61499V12.19H24.375Z" fill={color}/>
    <path d="M10.665 6.08997H9.14502V7.61997H10.665V6.08997Z" fill={color}/>
    <path d="M10.665 1.52002H9.14502V3.05002H10.665V1.52002Z" fill={color}/>
    <path d="M9.14499 16.76H7.61499V19.81H9.14499V16.76Z" fill={color}/>
    <path d="M9.14499 3.05005H7.61499V6.09005H9.14499V3.05005Z" fill={color}/>
    <path d="M7.61497 28.95H6.09497V30.4799H7.61497V28.95Z" fill={color}/>
    <path d="M7.61497 12.1899H6.09497V13.7099H7.61497V12.1899Z" fill={color}/>
    <path d="M6.09492 13.71H4.56492V15.24H3.04492V16.76H4.56492V24.38H3.04492V25.9H4.56492V28.95H6.09492V13.71Z" fill={color}/>
    <path d="M6.09494 7.62H4.56494V9.14H6.09494V7.62Z" fill={color}/>
    <path d="M6.09494 0H4.56494V1.52H6.09494V0Z" fill={color}/>
    <path d="M4.56492 1.52002H3.04492V7.62002H4.56492V1.52002Z" fill={color}/>
    <path d="M3.0449 16.76H1.5249V24.38H3.0449V16.76Z" fill={color}/>
  </svg>
)

export { RobotIcon }

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

  const cardStyle = {
    background: '#FFFFFF',
    border: '1px solid #E0DDD8',
    borderRadius: '1px',
    padding: '16px',
    marginBottom: '10px',
  }

  const labelStyle = {
    fontFamily: "'Archiv Grotesk', sans-serif",
    fontSize: '13px',
    fontWeight: 400,
    color: '#1F1B1D',
    lineHeight: 1.6,
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
        <div style={cardStyle}>
          <div style={{ marginBottom: '12px' }}>
            <RobotIcon size={28} color="#1F1B1D" />
          </div>
          <p style={labelStyle}>
            The suggestion feed uses your interaction and options used to create previous feeds to build a new, personalized one by machine.
          </p>
        </div>

        {/* Behavior preview */}
        {hasEnoughData && topCategories.length > 0 && (
          <div style={cardStyle}>
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
          <div style={cardStyle}>
            <p style={{ ...labelStyle, color: '#888580' }}>
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
          }}
        >
          {building ? 'Building...' : 'Build'}
        </button>
      </div>
    </div>
  )
}
