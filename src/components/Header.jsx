export default function Header() {
  return (
    <header style={{
      background: '#1F1B1D',
      padding: '12px 16px',
      flexShrink: 0,
    }}>
      <img
        src="/logo.svg"
        alt="notapp"
        style={{ height: '18px', display: 'block' }}
      />
    </header>
  )
}
