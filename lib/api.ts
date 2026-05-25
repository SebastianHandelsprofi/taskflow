import { createClient } from './supabase/client'

export async function fetchTasks(filters?: { status?: string; category?: string }) {
  const sb = createClient()
  let q = sb.from('tasks').select('*, assignee:profiles!assignee_id(id, full_name, team)').order('created_at', { ascending: false })
  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.category) q = q.eq('category', filters.category)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function createTask(task: any) {
  const sb = createClient()
  const { data, error } = await sb.from('tasks').insert(task).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, updates: any) {
  const sb = createClient()
  const { data, error } = await sb.from('tasks').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string) {
  const sb = createClient()
  const { error } = await sb.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function fetchProfiles() {
  const sb = createClient()
  const { data, error } = await sb.from('profiles').select('*').order('points', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchCurrentProfile() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single()
  if (error) {
    console.error('Profile fetch error:', error)
    return null
  }
  return data
}

export async function fetchLeaderboard() {
  const sb = createClient()
  const { data, error } = await sb.from('leaderboard').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchAllBadges() {
  const sb = createClient()
  const { data, error } = await sb.from('badges').select('*')
  if (error) throw error
  return data ?? []
}

export async function fetchUserBadges(userId: string) {
  const sb = createClient()
  const { data, error } = await sb.from('user_badges').select('*, badge:badges(*)').eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function fetchDashboardKPIs() {
  const sb = createClient()
  const { data, error } = await sb.from('dashboard_kpis').select('*').single()
  if (error) throw error
  return data
}

export async function fetchWeeklyActivity() {
  const sb = createClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data, error } = await sb.from('tasks').select('completed_at').eq('status', 'Erledigt').gte('completed_at', weekAgo.toISOString())
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
  const sb = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await sb.from('challenges').select('*').lte('starts_at', today).gte('ends_at', today)
  if (error) throw error
  return data ?? []
}

export async function signIn(email: string, password: string) {
  const sb = createClient()
  return sb.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string, fullName: string) {
  const sb = createClient()
  return sb.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
}

export async function signOut() {
  const sb = createClient()
  return sb.auth.signOut()
}
