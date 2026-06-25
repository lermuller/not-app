export default function Header() {
  return (
    <>
      <header style={{
        background: '#1F1B1D',
        padding: '14px 16px',
        flexShrink: 0,
      }}>
        <img
          src="/logo.svg"
          alt="notapp"
          style={{ height: '18px', display: 'block' }}
        />
      </header>
      {/* 8px gap reveals the dither background behind the app shell */}
      <div style={{ height: '8px', flexShrink: 0 }} />
    </>
  )
}
