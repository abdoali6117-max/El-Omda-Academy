import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  // بيانات افتراضية للعرض
  const [students, setStudents] = useState([
    { id: 1, name: 'أحمد محمود', phone: '01012345678', course: 'الرياضيات' },
    { id: 2, name: 'سارة علي', phone: '01123456789', course: 'الفيزياء' }
  ])
  const [courses, setCourses] = useState([
    { id: 1, title: 'الرياضيات العامة', teacher: 'أ. محمد العمدة', price: '500 ج.م' },
    { id: 2, title: 'الفيزياء الحديثة', teacher: 'أ. أحمد علي', price: '600 ج.م' }
  ])

  // نماذج الإضافة
  const [newStudent, setNewStudent] = useState({ name: '', phone: '', course: '' })
  const [newCourse, setNewCourse] = useState({ title: '', teacher: '', price: '' })

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
    setStudents([...students, { id: Date.now(), ...newStudent }])
    setNewStudent({ name: '', phone: '', course: '' })
  }

  const handleAddCourse = (e) => {
    e.preventDefault()
    if (!newCourse.title) return
    setCourses([...courses, { id: Date.now(), ...newCourse }])
    setNewCourse({ title: '', teacher: '', price: '' })
  }

  if (!session) {
    return <Login />
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8' }}>
      {/* Sidebar - الشريط الجانبي */}
      <div style={{ width: '240px', backgroundColor: '#1e293b', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '30px', textAlign: 'center', color: '#38bdf8' }}>🎓 أكاديمية العمدة</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li 
              onClick={() => setActiveTab('dashboard')} 
              style={{ padding: '12px', cursor: 'pointer', borderRadius: '6px', backgroundColor: activeTab === 'dashboard' ? '#334155' : 'transparent', marginBottom: '8px' }}
            >
              📊 لوحة التحكم
            </li>
            <li 
              onClick={() => setActiveTab('students')} 
              style={{ padding: '12px', cursor: 'pointer', borderRadius: '6px', backgroundColor: activeTab === 'students' ? '#334155' : 'transparent', marginBottom: '8px' }}
            >
              👨‍🎓 إدارة الطلاب
            </li>
            <li 
              onClick={() => setActiveTab('courses')} 
              style={{ padding: '12px', cursor: 'pointer', borderRadius: '6px', backgroundColor: activeTab === 'courses' ? '#334155' : 'transparent', marginBottom: '8px' }}
            >
              📚 إدارة الكورسات
            </li>
          </ul>
        </div>
        <div>
          <div style={{ fontSize: '12px', marginBottom: '10px', color: '#94a3b8', wordBreak: 'break-all' }}>{session.user.email}</div>
          <button 
            onClick={handleLogout} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main Content - المحتوى الرئيسي */}
      <div style={{ flex: 1, padding: '30px' }}>
        {/* قسم لوحة التحكم */}
        {activeTab === 'dashboard' && (
          <div>
            <h2>📊 الإحصائيات العامة</h2>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3>عدد الطلاب</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#0284c7', margin: '10px 0 0 0' }}>{students.length}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3>عدد الكورسات</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#16a34a', margin: '10px 0 0 0' }}>{courses.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* قسم إدارة الطلاب */}
        {activeTab === 'students' && (
          <div>
            <h2>👨‍🎓 إدارة الطلاب</h2>
            <form onSubmit={handleAddStudent} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="اسم الطالب" 
                value={newStudent.name} 
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} 
                style={{ flex: 1, padding: '8px' }} 
              />
              <input 
                type="text" 
                placeholder="رقم الهاتف" 
                value={newStudent.phone} 
                onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} 
                style={{ flex: 1, padding: '8px' }} 
              />
              <input 
                type="text" 
                placeholder="اسم الكورس" 
                value={newStudent.course} 
                onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })} 
                style={{ flex: 1, padding: '8px' }} 
              />
              <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>إضافة طالب</button>
            </form>

            <table style={{ width: '100%', backgroundColor: '#fff', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', textAlign: 'right' }}>
                  <th style={{ padding: '12px' }}>الاسم</th>
                  <th style={{ padding: '12px' }}>رقم الهاتف</th>
                  <th style={{ padding: '12px' }}>الكورس المسجل</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{s.name}</td>
                    <td style={{ padding: '12px' }}>{s.phone}</td>
                    <td style={{ padding: '12px' }}>{s.course}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* قسم إدارة الكورسات */}
        {activeTab === 'courses' && (
          <div>
            <h2>📚 إدارة الكورسات</h2>
            <form onSubmit={handleAddCourse} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="اسم الكورس" 
                value={newCourse.title} 
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} 
                style={{ flex: 1, padding: '8px' }} 
              />
              <input 
                type="text" 
                placeholder="اسم المعلم" 
                value={newCourse.teacher} 
                onChange={(e) => setNewCourse({ ...newCourse, teacher: e.target.value })} 
                style={{ flex: 1, padding: '8px' }} 
              />
              <input 
                type="text" 
                placeholder="السعر" 
                value={newCourse.price} 
                onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })} 
                style={{ flex: 1, padding: '8px' }} 
              />
              <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>إضافة كورس</button>
            </form>

            <table style={{ width: '100%', backgroundColor: '#fff', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ backgroundColor: '#e2e8f0', textAlign: 'right' }}>
                  <th style={{ padding: '12px' }}>اسم الكورس</th>
                  <th style={{ padding: '12px' }}>المعلم</th>
                  <th style={{ padding: '12px' }}>السعر</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{c.title}</td>
                    <td style={{ padding: '12px' }}>{c.teacher}</td>
                    <td style={{ padding: '12px' }}>{c.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
