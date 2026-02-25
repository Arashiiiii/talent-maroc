export default function DebugPage() {
  return (
    <div className="p-20 font-mono">
      <h1>Debug Info:</h1>
      <p>URL exists: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ YES' : '❌ MISSING'}</p>
      <p>KEY exists: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ YES' : '❌ MISSING'}</p>
      <hr className="my-4" />
      <p>Vercel Env: {process.env.VERCEL_ENV || 'unknown'}</p>
    </div>
  )
}