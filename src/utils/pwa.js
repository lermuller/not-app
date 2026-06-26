/**
 * Dynamically updates the PWA manifest and iOS meta tags so that
 * "Add to Home Screen" installs with the feed's name and theme color.
 *
 * Technique: replace the <link rel="manifest"> with a Blob URL that
 * contains a custom manifest object. iOS also reads
 * <meta name="apple-mobile-web-app-title"> independently.
 */
export function prepareInstall(feed, theme) {
  const manifest = {
    name: feed.name,
    short_name: feed.name.slice(0, 14),
    description: `${feed.name} — powered by notapp`,
    start_url: `/feed/${feed.id}`,
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: theme.primary,
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }

  // Replace manifest link with Blob URL (works for Android Chrome)
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
  const blobUrl = URL.createObjectURL(blob)
  let link = document.querySelector('link[rel="manifest"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'manifest'
    document.head.appendChild(link)
  }
  link.href = blobUrl

  // iOS Safari reads these meta tags independently
  document.title = feed.name
  setMeta('apple-mobile-web-app-title', feed.name)
  setMeta('apple-mobile-web-app-capable', 'yes')
  setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')
  setMeta('theme-color', theme.primary)
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

export function detectPlatform() {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function isAlreadyInstalled() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
}
