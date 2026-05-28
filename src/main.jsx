import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker } from '@/lib/push'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

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
