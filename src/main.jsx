import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker } from '@/lib/push'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Pages are code-split (React.lazy). After a new deploy, an already-open tab
// may request a chunk whose hashed filename no longer exists — Vite emits
// vite:preloadError. Reload once to pick up the fresh index + chunks.
// The flag blocks an immediate reload LOOP (error right after reloading), and
// clears after 30s of healthy runtime so a future deploy can reload again.
const CHUNK_RELOAD_KEY = 'sintetiko_chunk_reload'
setTimeout(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY), 30_000)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  window.location.reload()
})

// Register the service worker on every load so new deploys are picked up.
// When a new worker takes control, reload once so the freshest bundle is used.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    registerServiceWorker()
  })
}
