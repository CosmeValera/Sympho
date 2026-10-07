import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Before App, so the component styles in App.css come later in the cascade.
import './index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
