// oxlint-disable react/only-export-components -- This is the application bootstrap, not a refreshable component module.
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
const App = lazy(() => import('./App.tsx'))
const Studio = lazy(() => import('./studio/Studio.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p className="p-6">Загрузка…</p>}>
      {location.pathname === '/basic' ? <App /> : <Studio />}
    </Suspense>
  </StrictMode>,
)
