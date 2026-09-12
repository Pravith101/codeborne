import { useState } from 'react'
import { motion } from 'framer-motion'

export function AuthScreen({ onSubmit, configurationError }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const result = await onSubmit({ mode, email, password })
      if (result?.message) setMessage(result.message)
    } catch (submissionError) {
      setError(submissionError.message || 'The realm could not hear your call. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="auth-shell">
    <div className="auth-stars" aria-hidden="true" /><div className="auth-trees auth-trees-left" aria-hidden="true" /><div className="auth-trees auth-trees-right" aria-hidden="true" />
    <motion.section className="auth-panel" aria-labelledby="auth-title" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <div className="auth-mark" aria-hidden="true">&lt;/&gt;</div><p className="auth-brand">CODEBORNE</p><p className="auth-kicker">The Ashen Clearing awaits</p>
      <h1 id="auth-title">{mode === 'login' ? 'Enter the Realm' : 'Create a Character'}</h1>
      <p className="auth-copy">{mode === 'login' ? 'Return to the path you have begun.' : 'Bind your name to the old language.'}</p>
      {configurationError ? <p className="auth-feedback auth-error" role="alert">{configurationError}</p> : <form onSubmit={submit} className="auth-form">
        <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
        <label>Password<input required minLength="6" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}{message && <p className="auth-feedback auth-message" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Calling...' : mode === 'login' ? 'Awaken' : 'Create Character'} <span aria-hidden="true">→</span></button>
      </form>}
      <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }} disabled={busy}>{mode === 'login' ? 'New to the realm? Create character' : 'Already awakened? Enter the realm'}</button>
    </motion.section>
  </main>
}
