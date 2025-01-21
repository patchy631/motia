import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { Index } from './routes'
import { Flow } from './routes/flow'
import { RouteWrapper } from './route-wrapper'

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <BrowserRouter>
        <RouteWrapper>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/flow/:id" element={<Flow />} />
          </Routes>
        </RouteWrapper>
      </BrowserRouter>
    </StrictMode>,
  )
}
