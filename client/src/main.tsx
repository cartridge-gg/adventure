import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { StarknetProvider } from '@/components/StarknetProvider'

import AdventureApp from '@/AdventureApp'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StarknetProvider>
      <AdventureApp />
    </StarknetProvider>
  </StrictMode>,
)
