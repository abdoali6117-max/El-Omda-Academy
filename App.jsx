import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedAttendanceLevel, setSelectedAttendanceLevel] = useState('المستوى الأول')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. بيانات الطلاب
  const [students, setStudents] = useState([
    { id: '101', name: 'أحمد محمد', level: 'المستوى الأول', parentPhone: '01012345678', paid: 1500, remaining: 0, attendanceCount: 12 },
    { id: '102', name: 'سارة محمود', level: 'المستوى الثاني', parentPhone: '01123456789', paid: 1000, remaining: 500, attendanceCount: 8 },
    { id: '103', name: 'عمر خالد', level: 'المستوى الثالث', parentPhone: '01234567890', paid: 1500, remaining: 0, attendanceCount: 15 }
  ])

  // 2. بيانات المعاملات المالية
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'income', title: 'اشتراك المستوى الأول - أحمد محمد', amount: 1500, date: '2026-10-01' },
    { id: 2, type: 'income', title: 'اشتراك المستوى الثاني - سارة محمود', amount: 1000, date: '2026-10-02' },
    { id: 3, type: 'expense', title: 'إيجار المقر الشهري', amount: 800, date: '2026-10-03' },
    { id: 4, type: 'expense', title: 'أدوات ومستلزمات تدريب', amount: 200, date: '2026-10-04' }
  ])

  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const [newStudent, setNewStudent] = useState({ id: '', name: '', level: 'المستوى الأول', parentPhone: '', paid: 1500, remaining: 0 })
  const [newTransaction, setNewTransaction] = useState({ type: 'expense', title: '', amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const totalStudents = students.length
  const totalIncomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount || 0), 0)
  const netProfit = totalIncomes - totalExpenses

  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase().trim()
    return (
      student.name.toLowerCase().includes(term) ||
      String(student.id).toLowerCase().includes(term) ||
      (student.parentPhone && student.parentPhone.includes(term))
    )
  })

  const handleAddStudent = (e) => {
    e.preventDefault()
    if (!newStudent.name || !newStudent.id) {
      alert('يرجى كتابة اسم الطالب وكود الطالب!')
      return
    }

    const exists = students.some(s => String(s.id) === String(newStudent.id))
    if (exists) {
      alert('كود الطالب هذا مستخدم بالفعل!')
      return
    }

    setStudents([...students, { ...newStudent, attendanceCount: 0 }])
    
    if (Number(newStudent.paid) > 0) {
      setTransactions([...transactions, {
        id: Date.now(),
        type: 'income',
        title: `اشتراك جديد - ${newStudent.name} (#${newStudent.id})`,
        amount: Number(newStudent.paid),
        date: new Date().toISOString().split('T')[0]
      }])
    }

    setNewStudent({ id: '', name: '', level: 'المستوى الأول', parentPhone: '', paid: 1500, remaining: 0 })
    setShowAddStudentModal(false)
  }

  const handleDeleteStudent = (id, name) => {
    if (window.confirm(`تأكيد حذف الطالب "${name}"؟`)) {
      setStudents(students.filter(student => student.id !== id))
    }
  }

  const handleAddTransaction = (e) => {
    e.preventDefault()
    if (!newTransaction.title || !newTransaction.amount) return
    setTransactions([...transactions, { id: Date.now(), ...newTransaction, amount: Number(newTransaction.amount) }])
    setNewTransaction({ type: 'expense', title: '', amount: '', date: new Date().toISOString().split('T')[0] })
    setShowTransactionModal(false)
  }

  const handleAttendance = (studentId, type) => {
    setStudents(students.map(s => s.id === studentId ? { ...s, attendanceCount: type === 'present' ? s.attendanceCount + 1 : Math.max(0, s.attendanceCount - 1) } : s))
  }

  const handlePayInstallment = (studentId, amount) => {
    const payAmt = Number(amount)
    if (!payAmt) return
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return { ...s, paid: Number(s.paid) + payAmt, remaining: Math.max(0, Number(s.remaining) - payAmt) }
      }
      return s
    }))

    const student = students.find(s => s.id === studentId)
    setTransactions([...transactions, {
      id: Date.now(),
      type: 'income',
      title: `قسط - ${student?.name} (#${student?.id})`,
      amount: payAmt,
      date: new Date().toISOString().split('T')[0]
    }])
  }

  if (!session) return <Login />

  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Top Horizontal Navigation Bar - الشريط العلوي الأفقي */}
      <header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', sticky: 'top', top: 0, zIndex: 100 }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚡</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>أكاديمية العمدة</h2>
            <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: '600' }}>v2.0</span>
          </div>
        </div>

        {/* Horizontal Navigation Buttons */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'dashboard', icon: '📊', name: 'لوحة القيادة' },
            { id: 'students', icon: '👨‍🎓', name: 'إدارة الطلاب' },
            { id: 'attendance', icon: '📅', name: 'دفتر الحضور' },
            { id: 'finance', icon: '💳', name: 'الأقساط' },
            { id: 'transactions', icon: '📑', name: 'السجل المالي' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none',
                backgroundColor: activeTab === item.id ? '#6366f1' : 'transparent',
                color: activeTab === item.id ? '#fff' : '#94a3b8',
                cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whitespace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Action Buttons & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setShowAddStudentModal(true)} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>+ طالب جديد</button>
          <button onClick={() => setShowTransactionModal(true)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>+ قيد مالية</button>
          <button onClick={() => supabase.auth.signOut()} title="خروج" style={{ backgroundColor: '#334155', color: '#f87171', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>🚪 خروج</button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* 1. Dashboard View */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { title: 'إجمالي الطلاب', val: `${totalStudents} طالب`, color: '#6366f1' },
              { title: 'الإيرادات', val: `${totalIncomes.toLocaleString()} ج.م`, color: '#34d399' },
              { title: 'المصروفات', val: `${totalExpenses.toLocaleString()} ج.م`, color: '#f87171' },
              { title: 'صافي الأرباح', val: `${netProfit.toLocaleString()} ج.م`, color: '#fbbf24' }
            ].map((card, i) => (
              <div key={i} style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{card.title}</span>
                <h2 style={{ margin: 0, fontSize: '26px', color: card.color }}>{card.val}</h2>
              </div>
            ))}
          </div>
        )}

        {/* 2. Students View */}
        {activeTab === 'students' && (
          <div>
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم، الكود، أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', padding: '12px 18px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', marginBottom: '24px', outline: 'none' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredStudents.map(s => (
                <div key={s.id} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ backgroundColor: '#312e81', color: '#818cf8', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>#{s.id}</span>
                      <button onClick={() => handleDeleteStudent(s.id, s.name)} style={{ backgroundColor: '#7f1d1d', color: '#f87171', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>حذف</button>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#fff' }}>{s.name}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{s.level}</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>📱 ولي الأمر: {s.parentPhone || 'غير مسجل'}</p>
                  </div>

                  <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>مدفوع: {s.paid}ج</span>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>متبقي: {s.remaining}ج</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Attendance View */}
        {activeTab === 'attendance' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['المستوى الأول', 'المستوى الثاني', 'المستوى الثالث'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedAttendanceLevel(lvl)}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                    backgroundColor: selectedAttendanceLevel === lvl ? '#6366f1' : '#1e293b',
                    color: selectedAttendanceLevel === lvl ? '#fff' : '#94a3b8'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '13px' }}>
                    <th style={{ padding: '12px' }}>الكود</th>
                    <th style={{ padding: '12px' }}>الاسم</th>
                    <th style={{ padding: '12px' }}>الحصص</th>
                    <th style={{ padding: '12px' }}>تسجيل الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.level === selectedAttendanceLevel).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', color: '#818cf8', fontWeight: 'bold' }}>#{s.id}</td>
                      <td style={{ padding: '12px', color: '#fff' }}>{s.name}</td>
                      <td style={{ padding: '12px' }}>{s.attendanceCount} حصة</td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAttendance(s.id, 'present')} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>حضور +</button>
                        <button onClick={() => handleAttendance(s.id, 'absent')} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>خصم -</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Finance View */}
        {activeTab === 'finance' && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '12px' }}>الكود</th>
                  <th style={{ padding: '12px' }}>الاسم</th>
                  <th style={{ padding: '12px' }}>المدفوع</th>
                  <th style={{ padding: '12px' }}>المتبقي</th>
                  <th style={{ padding: '12px' }}>تحصيل قسط</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', color: '#818cf8', fontWeight: 'bold' }}>#{s.id}</td>
                    <td style={{ padding: '12px', color: '#fff' }}>{s.name}</td>
                    <td style={{ padding: '12px', color: '#34d399', fontWeight: 'bold' }}>{s.paid} ج.م</td>
                    <td style={{ padding: '12px', color: '#fbbf24', fontWeight: 'bold' }}>{s.remaining} ج.م</td>
                    <td style={{ padding: '12px' }}>
                      {s.remaining > 0 ? (
                        <button onClick={() => { const amt = prompt(`قسط ${s.name}:`, s.remaining); if (amt) handlePayInstallment(s.id, amt) }} style={{ backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>💳 دفع قسط</button>
                      ) : (
                        <span style={{ color: '#34d399', fontSize: '12px' }}>مكتمل ✔️</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Transactions View */}
        {activeTab === 'transactions' && (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '20px', border: '1px solid #334155' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '12px' }}>الحركة</th>
                  <th style={{ padding: '12px' }}>الوصف</th>
                  <th style={{ padding: '12px' }}>المبلغ</th>
                  <th style={{ padding: '12px' }}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: t.type === 'income' ? '#064e3b' : '#7f1d1d', color: t.type === 'income' ? '#34d399' : '#f87171' }}>
                        {t.type === 'income' ? 'إيراد +' : 'مصروف -'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#fff' }}>{t.title}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: t.type === 'income' ? '#34d399' : '#f87171' }}>{t.amount} ج.م</td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* Modal: Add Student */}
      {showAddStudentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '28px', borderRadius: '20px', width: '380px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>إضافة طالب جديد</h3>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="كود الطالب" required value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              <input type="text" placeholder="اسم الطالب" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              <input type="text" placeholder="رقم ولي الأمر" required value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              <select value={newStudent.level} onChange={e => setNewStudent({...newStudent, level: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}>
                <option>المستوى الأول</option>
                <option>المستوى الثاني</option>
                <option>المستوى الثالث</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="المدفوع" value={newStudent.paid} onChange={e => setNewStudent({...newStudent, paid: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
                <input type="number" placeholder="المتبقي" value={newStudent.remaining} onChange={e => setNewStudent({...newStudent, remaining: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ</button>
                <button type="button" onClick={() => setShowAddStudentModal(false)} style={{ flex: 1, backgroundColor: '#334155', color: '#94a3b8', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transaction */}
      {showTransactionModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '28px', borderRadius: '20px', width: '380px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>إضافة حركة مالية</h3>
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}>
                <option value="expense">مصروف (-)</option>
                <option value="income">إيراد (+)</option>
              </select>
              <input type="text" placeholder="البيان" required value={newTransaction.title} onChange={e => setNewTransaction({...newTransaction, title: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              <input type="number" placeholder="المبلغ" required value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              <input type="date" value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>تسجيل</button>
                <button type="button" onClick={() => setShowTransactionModal(false)} style={{ flex: 1, backgroundColor: '#334155', color: '#94a3b8', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
