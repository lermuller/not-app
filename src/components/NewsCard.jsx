import { timeAgo } from '../utils/rss'

export default function NewsCard({ item, theme }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        background: '#FFFFFF',
        border: `1px solid ${theme.secondary}`,
        borderRadius: theme.radius,
        padding: '12px 14px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{
          fontFamily: "'Archiv Grotesk', sans-serif",
          fontSize: '9px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: theme.primary,
        }}>
          {item.portalName}
        </span>
        <span style={{
          fontFamily: "'Archiv Grotesk', sans-serif",
          fontSize: '9px',
          color: '#6B6966',
        }}>
          {timeAgo(item.pubDate)}
        </span>
      </div>

      <p style={{
        fontFamily: theme.font,
        fontSize: theme.id === 'tech' ? '12px' : '13px',
        fontWeight: theme.headlineWeight,
        textTransform: theme.headlineTransform,
        letterSpacing: theme.headlineTracking,
        lineHeight: 1.45,
        color: '#1F1B1D',
        marginBottom: item.description ? '6px' : 0,
      }}>
        {item.title}
      </p>

      {item.description && (
        <p style={{
          fontFamily: "'Archiv Grotesk', sans-serif",
          fontSize: '11px',
          fontWeight: 400,
          color: '#4A4745',
          lineHeight: 1.5,
        }}>
          {item.description}
        </p>
      )}
    </a>
  )
}
