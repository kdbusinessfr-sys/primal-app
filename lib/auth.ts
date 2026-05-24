import { supabase } from './supabase'

// Inscription
export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  })

  if (error) throw error

  // Crée le profil utilisateur dans la table users
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        username,
      })
    if (profileError) throw profileError
  }

  return data
}

// Connexion
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

// Déconnexion
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Récupérer l'utilisateur connecté
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Récupérer le profil utilisateur
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}
