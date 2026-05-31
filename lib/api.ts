import { createClient } from '@supabase/supabase-js'

const sb = () => createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YmdtY2Fsb2JhYmFmZHJ4amNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTA0ODIsImV4cCI6MjA5NTI2NjQ4Mn0.XrD62q_DtiTmInz6SqnHlQ9QPQtZNDaVPATBteoZ9xg'
)

export async function fetchTasks() {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function createTask(task: any) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function fetchProfiles() {
  const res = await fetch('/api/profiles')
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateTask(id: string, updates: any) {
  const { data, error } = await sb().from('tasks').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string) {
  const { error } = await sb().from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function fetchLeaderboard() {
  const { data, error } = await sb().from('leaderboard').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchAllBadges() {
  const { data, error } = await sb().from('badges').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchUserBadges(userId: string) {
  const { data, error } = await sb().from('user_badges').select('*, badge:badges(*)').eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function fetchDashboardKPIs() {
  const { data, error } = await sb().from('dashboard_kpis').select('*').single()
  if (error) throw error
  return data
}

export async function fetchWeeklyActivity() {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data, error } = await sb().from('tasks').select('completed_at').eq('status', 'Erledigt').gte('completed_at', weekAgo.toISOString())
  if (error) throw error
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const counts: Record<string, number> = {}
  days.forEach(d => (counts[d] = 0))
  ;(data ?? []).forEach((t: any) => {
    if (t.completed_at) {
      const day = days[new Date(t.completed_at).getDay()]
      counts[day] = (counts[day] || 0) + 1
    }
  })
  return ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => ({ day: d, value: counts[d] || 0 }))
}

export async function fetchActiveChallenges() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await sb().from('challenges').select('*').lte('starts_at', today).gte('ends_at', today)
  if (error) throw error
  return data ?? []
}

export async function signIn(email: string, password: string) {
  return sb().auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string, fullName: string) {
  return sb().auth.signUp({ email, password, options: { data: { full_name: fullName } } })
}

export async function signOut() {
  return sb().auth.signOut()
}
