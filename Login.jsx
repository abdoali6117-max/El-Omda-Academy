import React, { useState } from 'react'
import { supabase } from './supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg('خطأ في البريد الإلكتروني أو كلمة المرور')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      direction: 'rtl',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '20px'
    }}>

      {/* خلفية العلامة المائية الشفافة (صورة البوستر) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url('https://raw.githubusercontent.com/abdoali6117-max/El-Omda-Academy/main/public/poster.jpeg')`, // سيتم استخدام البوستر كخلفية مائية
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.12, // درجة شفافية العلامة المائية
        filter: 'blur(3px)',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      {/* كارت تسجيل الدخول Modern Card */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        padding: '40px 32px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>

        {/* رأس الصفحة والشعار */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            backgroundColor: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: '900',
            color: '#ffffff',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}>
            A
          </div>

          <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', color: '#fff', fontWeight: 'bold' }}>
            أكاديمية العمدة
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#818cf8', fontWeight: '600' }}>
            نظام الإدارة المتكامل • تعليم الكمبيوتر للأطفال
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #f87171',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>
              كلمة المرور
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '14px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول 🚀'}
          </button>
        </form>

        {/* رقم التواصل في الأسفل */}
        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          📞 للتواصل والدعم الفني: <span style={{ color: '#34d399', fontWeight: 'bold' }}>01220389881</span>
        </div>

      </div>
    </div>
  )
}

export default Login
