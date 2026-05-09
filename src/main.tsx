import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'
import config from './resources/config/config.ts'

// Initialize i18n for multi-language support
import './i18n'

// ─── App Version ────────────────────────────────────────────────────────────
// Expose version globally so team can check via DevTools console:
//   Type: __HUSHH_VERSION__  →  { version, built, commit }
// This survives production minification (unlike console.log which is stripped)
;(window as any).__HUSHH_VERSION__ = {
  version: __APP_VERSION__,
  built: __BUILD_TIMESTAMP__,
  commit: __GIT_COMMIT__,
}

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`)

  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute("name", name)
    document.head.appendChild(meta)
  }

  meta.setAttribute("content", content)
}

upsertMeta("app-version", __APP_VERSION__)
upsertMeta("build-commit", __GIT_COMMIT__)
upsertMeta("deploy-verified", __BUILD_TIMESTAMP__)

// Import DM Sans font weights
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MotionConfig>
  </React.StrictMode>,
)
