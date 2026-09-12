import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigurationError } from '../../lib/supabaseClient'

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState(() => (supabase ? 'loading' : 'unauthenticated'))
  const [profileError, setProfileError] = useState(null)

  const loadProfile = useCallback(async (userId) => {
    if (!supabase) return
    setStatus('loading-profile')
    setProfileError(null)
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (error) { setProfileError(error.message); setStatus('profile-error'); return }
      if (data) { setProfile(data); setStatus('ready'); return }
      await wait(350)
    }
    setProfileError('Your player profile is not ready. Confirm the CP02 database migration has been applied, then try again.')
    setStatus('profile-error')
  }, [])

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) { setProfileError(error.message); setStatus('unauthenticated'); return }
      setSession(data.session)
      setStatus(data.session ? 'loading-profile' : 'unauthenticated')
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setProfile(null)
      setStatus(nextSession ? 'loading-profile' : 'unauthenticated')
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return undefined
    const timer = window.setTimeout(() => loadProfile(session.user.id), 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile, session?.user?.id])

  const submitAuth = useCallback(async ({ mode, email, password }) => {
    if (!supabase) throw new Error(supabaseConfigurationError)
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (!data.session) return { message: 'Character created. Check your email to confirm your path, then return to enter the realm.' }
      return { message: 'Character created. The village is opening.' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { message: 'The village is opening.' }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  return { profile, profileError, session, signOut, status, submitAuth, retryProfile: () => loadProfile(session?.user?.id) }
}
