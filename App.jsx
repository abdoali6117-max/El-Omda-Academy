import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // بيانات الطلاب والحسابات القابلة للتحكم
  const [students, setStudents] = useState([
    { id: 1, name: 'احمد محمد', level: 'المستوى الأول', paid: 1500, remaining: 0, sessions: 10 },
    { id: 2, name: 'سارة محمود', level: 'المستوى الثاني', paid: 1000, remaining: 500, sessions: 5 }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', level: 'المستوى الأول', paid: 1500, remaining: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleAddStudent = (e) => {
    e.preventDefault()
    if (!newStudent.name) return
    setStudents([...students, { id: Date.now(), ...newStudent, sessions: 0 }])
    setNewStudent({ name: '', level: 'المستوى الأول', paid: 1500, remaining: 0 })
    setShowAddModal(false)
  }

  // حساب الحسابات ديناميكياً
  const totalStudents = students.length
  const totalPaid = students.reduce((acc, curr) => acc + Number(curr.paid || 0), 0)
  const totalRemaining = students.reduce((acc, curr) => acc + Number(curr.remaining || 0), 0)
  const avgAttendance = Math.round((students.reduce((acc, curr) => acc + Number(curr.sessions || 0), 0) / (totalStudents * 30 || 1)) * 100)

  const countL1 = students.filter(s => s.level === 'المستوى الأول').length
  const countL2 = students.filter(s => s.level === 'المستوى الثاني').length
  const countL3 = students.filter(s => s.level === 'المستوى الثالث').length

  if (!session) {
    return <Login />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar - الشريط الجانبي */}
      <div style={{ width: '260px', backgroundColor: '#1e1e38', color: '#fff', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#6366f1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              💻
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>العمده اكاديمي</h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>إدارة الطلاب والحسابات</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: activeTab === 'dashboard' ? '#4f46e5' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'right', fontSize: '14px', fontWeight: '500'
              }}
            >
              <span>📊</span> لوحة التحكم الرئيسية
            </button>

            <button
              onClick={() => setActiveTab('students')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: activeTab === 'students' ? '#4f46e5' : 'transparent', color: activeTab === 'students' ? '#fff' : '#cbd5e1', cursor: 'pointer', textAlign: 'right', fontSize: '14px'
              }}
            >
              <span>🎓</span> إدارة الطلاب
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: activeTab === 'sessions' ? '#4f46e5' : 'transparent', color: activeTab === 'sessions' ? '#fff' : '#cbd5e1', cursor: 'pointer', textAlign: 'right', fontSize: '14px'
              }}
            >
              <span>📅</span> متابعة الـ 30 حصة
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: activeTab === 'finance' ? '#4f46e5' : 'transparent', color: activeTab === 'finance' ? '#fff' : '#cbd5e1', cursor: 'pointer', textAlign: 'right', fontSize: '14px'
              }}
            >
              <span>💳</span> الأقساط والحسابات
            </button>
          </div>
        </div>

        {/* User Footer */}
        <div style={{ borderTop: '1px solid #334155', pt: '16px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 8px' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>المسؤول (Admin)</span>
            <button onClick={handleLogout} title="تسجيل الخروج" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>🚪</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ flex: 1, padding: '6px', fontSize: '12px', backgroundColor: '#2d2d4f', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📤 تصدير</button>
            <button style={{ flex: 1, padding: '6px', fontSize: '12px', backgroundColor: '#2d2d4f', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📥 استيراد</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '32px' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 'bold' }}>
            {activeTab === 'dashboard' && 'لوحة التحكم الرئيسية'}
            {activeTab === 'students' && 'إدارة الطلاب'}
            {activeTab === 'sessions' && 'متابعة الـ 30 حصة'}
            {activeTab === 'finance' && 'الأقساط والحسابات'}
          </h1>

          <button 
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>+</span> إضافة طالب جديد
          </button>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              
              {/* Card 1: Total Students */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>إجمالي الطلاب</p>
                  <h2 style={{ margin: '8px 0 4px 0', fontSize: '24px', color: '#0f172a' }}>{totalStudents}</h2>
                  <span style={{ fontSize: '11px', color: '#6366f1' }}>بالمراحل الثلاث</span>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#e0e7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👥</div>
              </div>

              {/* Card 2: Revenue */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>الإيرادات المحصلة</p>
                  <h2 style={{ margin: '8px 0 4px 0', fontSize: '24px', color: '#0f172a' }}>{totalPaid.toLocaleString()} ج.م</h2>
                  <span style={{ fontSize: '11px', color: '#10b981' }}>مدفوعات المستويات</span>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#d1fae5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💵</div>
              </div>

              {/* Card 3: Remaining */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>المبالغ المتبقية</p>
                  <h2 style={{ margin: '8px 0 4px 0', fontSize: '24px', color: '#0f172a' }}>{totalRemaining.toLocaleString()} ج.م</h2>
                  <span style={{ fontSize: '11px', color: '#f59e0b' }}>أقساط متاخرة</span>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⏳</div>
              </div>

              {/* Card 4: Attendance */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>نسبة الحضور والإنجاز</p>
                  <h2 style={{ margin: '8px 0 4px 0', fontSize: '24px', color: '#0f172a' }}>{avgAttendance}%</h2>
                  <span style={{ fontSize: '11px', color: '#6366f1' }}>معدل تنفيذ الـ 30 حصة</span>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#e0e7ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📈</div>
              </div>

            </div>

            {/* Bottom Section: Distribution & Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              
              {/* Visual Distribution Chart */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#0f172a' }}>توزيع الطلاب حسب المستوى</h3>
                <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  
                  {/* Bar Level 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ width: '60px', height: `${Math.max(countL1 * 50, 10)}px`, backgroundColor: '#4f46e5', borderRadius: '8px 8px 0 0', transition: 'height 0.3s' }}></div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>المستوى الأول</span>
                  </div>

                  {/* Bar Level 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ width: '60px', height: `${Math.max(countL2 * 50, 10)}px`, backgroundColor: '#a855f7', borderRadius: '8px 8px 0 0', transition: 'height 0.3s' }}></div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>المستوى الثاني</span>
                  </div>

                  {/* Bar Level 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ width: '60px', height: `${Math.max(countL3 * 50, 10)}px`, backgroundColor: '#e2e8f0', borderRadius: '8px 8px 0 0', transition: 'height 0.3s' }}></div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>المستوى الثالث</span>
                  </div>

                </div>
              </div>

              {/* Levels Breakdown */}
              <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#0f172a' }}>إحصاءات المستويات</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                      <span style={{ fontSize: '14px', color: '#334155' }}>المستوى الأول</span>
                      <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{countL1} طالب</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                      <span style={{ fontSize: '14px', color: '#334155' }}>المستوى الثاني</span>
                      <span style={{ backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{countL2} طالب</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                      <span style={{ fontSize: '14px', color: '#334155' }}>المستوى الثالث</span>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#d97706', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{countL3} طالب</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px', fontSize: '11px', color: '#1e40af', lineHeight: '1.5' }}>
                  💡 الاشتراك الثابت للمستوى الواحد: <strong>1,500 جنيه</strong> بمعدل <strong>30 حصة</strong> (حصتين أسبوعياً).
                </div>
              </div>

            </div>
          </>
        )}

        {/* Tab: Manage Students */}
        {activeTab === 'students' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '14px' }}>
                  <th style={{ padding: '12px' }}>اسم الطالب</th>
                  <th style={{ padding: '12px' }}>المستوى</th>
                  <th style={{ padding: '12px' }}>المدفوع</th>
                  <th style={{ padding: '12px' }}>المتبقي</th>
                  <th style={{ padding: '12px' }}>الحصص المكتملة</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '14px' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{s.name}</td>
                    <td style={{ padding: '12px' }}>{s.level}</td>
                    <td style={{ padding: '12px', color: '#10b981' }}>{s.paid} ج.م</td>
                    <td style={{ padding: '12px', color: '#f59e0b' }}>{s.remaining} ج.م</td>
                    <td style={{ padding: '12px' }}>{s.sessions} / 30</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>إضافة طالب جديد</h3>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>اسم الطالب</label>
                <input 
                  type="text" 
                  required 
                  value={newStudent.name} 
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b' }}>المستوى</label>
                <select 
                  value={newStudent.level} 
                  onChange={e => setNewStudent({...newStudent, level: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                >
                  <option>المستوى الأول</option>
                  <option>المستوى الثاني</option>
                  <option>المستوى الثالث</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#64748b' }}>المبلغ المدفوع</label>
                  <input 
                    type="number" 
                    value={newStudent.paid} 
                    onChange={e => setNewStudent({...newStudent, paid: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#64748b' }}>المبلغ المتبقي</label>
                  <input 
                    type="number" 
                    value={newStudent.remaining} 
                    onChange={e => setNewStudent({...newStudent, remaining: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ الطالب</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
