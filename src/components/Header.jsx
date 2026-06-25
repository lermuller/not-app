export default function Header() {
  return (
    <header style={{
      background: '#1F1B1D',
      padding: '14px 16px',
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: "'Archiv Grotesk', sans-serif",
        fontSize: '15px',
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '-0.3px',
      }}>
        not<span style={{ fontWeight: 400, opacity: 0.5 }}>app</span>
      </span>
    </header>
  )
}
