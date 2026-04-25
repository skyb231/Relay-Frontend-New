import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './app/router'
import { AuthSessionProvider } from './app/AuthSessionProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthSessionProvider>
      <RouterProvider router={appRouter} />
    </AuthSessionProvider>
  </StrictMode>,
)
