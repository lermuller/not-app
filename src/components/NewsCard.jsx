import { timeAgo } from '../utils/rss'
import { CATEGORIES } from '../tokens'

export default function NewsCard({ item, theme, showCategoryTag = false, geoTag = null, onArticleClick = null }) {
  const catLabel = showCategoryTag && item.itemCategory
    ? CATEGORIES[item.itemCategory]?.labelPT
    : null

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onArticleClick?.(item.itemCategory)}
      style={{ display: 'block', background: '#FFFFFF', border: `1px solid ${theme.secondary}`, borderRadius: theme.radius, padding: '12px 14px', textDecoration: 'none', color: 'inherit', transition: 'opacity 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme.primary }}>
            {item.portalName}
          </span>
          {catLabel && (
            <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '1px 6px', borderRadius: theme.radius, background: theme.primary, color: '#FFFFFF' }}>
              {catLabel}
            </span>
          )}
          {geoTag && (
            <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1px 5px', borderRadius: theme.radius, background: 'rgba(0,0,0,0.06)', color: '#4A4745', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {geoTag}
            </span>
          )}
        </div>
        <span style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '9px', color: '#6B6966', flexShrink: 0 }}>
          {timeAgo(item.pubDate)}
        </span>
      </div>

      {/* Headline */}
      <p style={{ fontFamily: theme.font, fontSize: theme.id === 'tech' ? '12px' : '13px', fontWeight: theme.headlineWeight, textTransform: theme.headlineTransform, letterSpacing: theme.headlineTracking, lineHeight: 1.45, color: '#1F1B1D', marginBottom: item.description ? '6px' : 0 }}>
        {item.title}
      </p>

      {item.description && (
        <p style={{ fontFamily: "'Archiv Grotesk', sans-serif", fontSize: '11px', fontWeight: 400, color: '#4A4745', lineHeight: 1.5 }}>
          {item.description}
        </p>
      )}
    </a>
  )
}
