import type { ReactNode } from 'react'
import { TtsProvider } from '../../context/TtsContext'
import { Navbar } from './Navbar'

type PageLayoutProps = {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <TtsProvider>
      <div className="min-h-screen bg-slate-100/60">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-4 md:px-6 md:py-5">{children}</main>
        </div>
      </div>
    </TtsProvider>
  )
}
