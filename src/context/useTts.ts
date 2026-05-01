import { useContext } from 'react'
import { TtsContext } from './TtsContext'

export function useTts() {
  const ctx = useContext(TtsContext)
  if (!ctx) throw new Error('useTts must be used within TtsProvider')
  return ctx
}

