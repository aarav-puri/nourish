import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 401 })
  }

  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    return NextResponse.json({ error: 'Account deletion is not configured' }, { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // The caller's own token proves who they are; we never trust a client-supplied id.
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }

  const userId = userData.user.id

  const tables = ['scanned_products', 'ai_insights', 'ai_usage']
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq('user_id', userId)
    if (error) {
      console.error(`Failed to delete ${table} for user ${userId}:`, error)
      return NextResponse.json({ error: `Failed to delete account data (${table})` }, { status: 500 })
    }
  }

  await admin.storage.from('avatars').remove([
    `${userId}/avatar.jpg`,
    `${userId}/avatar.jpeg`,
    `${userId}/avatar.png`,
    `${userId}/avatar.webp`,
    `${userId}/avatar.gif`,
  ])

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error(`Failed to delete auth user ${userId}:`, deleteError)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
