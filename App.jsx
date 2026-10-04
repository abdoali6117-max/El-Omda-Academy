import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // التحقق من حالة التسجيل الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // الاستماع لتغيرات حالة التسجيل (دخول / خروج)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ textDirection: 'rtl', fontFamily: 'sans-serif' }}>
      {!session ? (
        <Login />
      ) : (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>🎉 أهلاً بك في أكاديمية العمدة!</h2>
          <p>تم تسجيل دخولك بنجاح باستخدام:</p>
          <strong style={{ color: '#3ecf8e' }}>{session.user.email}</strong>
          <br /><br />
          <button
            onClick={handleLogout}
            style={{ padding: '10px 20px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            تسجيل الخروج
          </button>
        </div>
      )}
    </div>
  )
}

export default App
