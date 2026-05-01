import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeRole, postLoginPath } from '../roles'
import { useAuthSession } from '../app/useAuthSession'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { relayService } from '../services/relayService'

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const user = await relayService.login({ username, password })
      setUser(user)
      void navigate(postLoginPath(normalizeRole(user.role)))
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--relay-page)] px-4 py-10 sm:px-6">
      <Card className="w-full max-w-[520px] rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_24px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="text-center">
          <h1 className="text-5xl font-bold leading-none tracking-tight text-[var(--relay-navy)] sm:text-6xl">
            Relay
          </h1>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Enterprise Continuity Handover Dashboard
          </p>
        </div>
        <form
          className="mt-10 space-y-6"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <FormField
            label="Username"
            className="space-y-2"
            labelClassName="block text-base font-semibold text-slate-700"
          >
            <Input
              type="text"
              placeholder="Enter your username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-12 rounded-lg border-slate-200 px-4 text-base placeholder:italic placeholder:text-slate-400"
            />
          </FormField>
          <FormField
            label="Password"
            className="space-y-2"
            labelClassName="block text-base font-semibold text-slate-700"
          >
            <Input
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-lg border-slate-200 px-4 text-base placeholder:italic placeholder:text-slate-400"
            />
          </FormField>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-12 w-full rounded-lg text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  )
}
