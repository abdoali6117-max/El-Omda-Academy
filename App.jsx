import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedAttendanceLevel, setSelectedAttendanceLevel] = useState('المستوى الأول')

  // 1. قاعدة بيانات الطلاب
  const [students, setStudents] = useState([
    { id: '101', name: 'أحمد محمد', level: 'المستوى الأول', parentPhone: '01012345678', paid: 1500, remaining: 0, attendanceCount: 12 },
    { id: '102', name: 'سارة محمود', level: 'المستوى الثاني', parentPhone: '01123456789', paid: 1000, remaining: 500, attendanceCount: 8 },
    { id: '103', name: 'عمر خالد', level: 'المستوى الثالث', parentPhone: '01234567890', paid: 1500, remaining: 0, attendanceCount: 15 }
  ])

  // 2. قاعدة بيانات المصروفات والإيرادات الإضافية
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'income', title: 'اشتراك المستوى الأول - أحمد محمد', amount: 1500, date: '2026-10-01' },
    { id: 2, type: 'income', title: 'اشتراك المستوى الثاني - سارة محمود', amount: 1000, date: '2026-10-02' },
    { id: 3, type: 'expense', title: 'إيجار المقر الشهري', amount: 800, date: '2026-10-03' },
    { id: 4, type: 'expense', title: 'أدوات ومستلزمات تدريب', amount: 200, date: '2026-10-04' }
  ])

  // أشكال النافذة المنبثقة (Modals)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  // نماذج الإدخال مع حقل كود الطالب اليدوي
  const [newStudent, setNewStudent] = useState({ id: '', name: '', level: 'المستوى الأول', parentPhone: '', paid: 1500, remaining: 0 })
  const [newTransaction, setNewTransaction] = useState({ type: 'expense', title: '', amount: '', date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // الحسابات المباشرة
  const totalStudents = students.length
  const totalIncomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount || 0), 0)
  const netProfit = totalIncomes - totalExpenses

  // إضافة طالب جديد بكود مخصص
  const handleAddStudent = (e) => {
    e.preventDefault()
    if (!newStudent.name || !newStudent.id) {
      alert('يرجى كتابة اسم الطالب وكود الطالب!')
      return
    }

    // التحقق من عدم تكرار الكود
    const exists = students.some(s => String(s.id) === String(newStudent.id))
    if (exists) {
      alert('كود الطالب هذا مستخدم بالفعل، يرجى كتابة كود مختلف.')
      return
    }

    const createdStudent = { ...newStudent, attendanceCount: 0 }
    setStudents([...students, createdStudent])
    
    // تسجيل إيراد تلقائي في حال دفع مبلغ
    if (Number(newStudent.paid) > 0) {
      setTransactions([...transactions, {
        id: Date.now(),
        type: 'income',
        title: `اشتراك جديد - ${newStudent.name} (كود: ${newStudent.id})`,
        amount: Number(newStudent.paid),
        date: new Date().toISOString().split('T')[0]
      }])
    }

    setNewStudent({ id: '', name: '', level: 'المستوى الأول', parentPhone: '', paid: 1500, remaining: 0 })
    setShowAddStudentModal(false)
  }

  // 🗑 دالة حذف الطالب
  const handleDeleteStudent = (id, name) => {
    const confirmDelete = window.confirm(`هل أنت تأكد من رغبتك في حذف الطالب "${name}"؟`)
    if (confirmDelete) {
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

  // تسجيل الحضور والغياب
  const handleAttendance = (studentId, type) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          attendanceCount: type === 'present' ? s.attendanceCount + 1 : Math.max(0, s.attendanceCount - 1)
        }
      }
      return s
    }))
  }

  // تسجيل قسط جديد
  const handlePayInstallment = (studentId, amount) => {
    const payAmt = Number(amount)
    if (!payAmt) return
    setStudents(students.map(s => {
      if (s.id === studentId) {
        const newPaid = Number(s.paid) + payAmt
        const newRemaining = Math.max(0, Number(s.remaining) - payAmt)
        return { ...s, paid: newPaid, remaining: newRemaining }
      }
      return s
    }))

    const student = students.find(s => s.id === studentId)
    setTransactions([...transactions, {
      id: Date.now(),
      type: 'income',
      title: `قسط سداد - ${student?.name} (كود: ${student?.id})`,
      amount: payAmt,
      date: new Date().toISOString().split('T')[0]
    }])
  }

  if (!session) return <Login />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', fontFamily: 'Segoe UI, Tahoma, sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar - الشريط الجانبي */}
      <div style={{ width: '260px', backgroundColor: '#1e1e38', color: '#fff', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#6366f1', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💻</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>أكاديمية الناشئين</h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>إدارة الطلاب والحسابات</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>📊 لوحة التحكم الرئيسية</button>
            <button onClick={() => setActiveTab('students')} style={navBtnStyle(activeTab === 'students')}>🎓 إدارة الطلاب</button>
            <button onClick={() => setActiveTab('attendance')} style={navBtnStyle(activeTab === 'attendance')}>📅 الحضور والغياب</button>
            <button onClick={() => setActiveTab('finance')} style={navBtnStyle(activeTab === 'finance')}>💳 الأقساط والحسابات</button>
            <button onClick={() => setActiveTab('transactions')} style={navBtnStyle(activeTab === 'transactions')}>📝 الإيرادات والمصروفات</button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>المسؤول (Admin)</span>
            <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>🚪</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: 'bold' }}>
            {activeTab === 'dashboard' && 'لوحة التحكم الرئيسية'}
            {activeTab === 'students' && 'إدارة الطلاب'}
            {activeTab === 'attendance' && 'تسجيل الحضور والغياب'}
            {activeTab === 'finance' && 'كشف الأقساط والحسابات'}
            {activeTab === 'transactions' && 'دفتر الإيرادات والمصروفات'}
          </h1>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowAddStudentModal(true)} style={primaryBtnStyle}>+ إضافة طالب جديد</button>
            <button onClick={() => setShowTransactionModal(true)} style={secondaryBtnStyle}>+ إضافة إيراد / مصروف</button>
          </div>
        </div>

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>إجمالي الطلاب</p>
                <h2 style={cardValueStyle}>{totalStudents}</h2>
                <span style={{ fontSize: '11px', color: '#6366f1' }}>طالب مسجل</span>
              </div>
              <div style={iconBoxStyle('#e0e7ff')}>👥</div>
            </div>

            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>إجمالي الإيرادات</p>
                <h2 style={cardValueStyle}>{totalIncomes.toLocaleString()} ج.م</h2>
                <span style={{ fontSize: '11px', color: '#10b981' }}>إجمالي المقبوضات</span>
              </div>
              <div style={iconBoxStyle('#d1fae5')}>💵</div>
            </div>

            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>إجمالي المصروفات</p>
                <h2 style={cardValueStyle}>{totalExpenses.toLocaleString()} ج.م</h2>
                <span style={{ fontSize: '11px', color: '#ef4444' }}>إجمالي المصاريف</span>
              </div>
              <div style={iconBoxStyle('#fee2e2')}>📉</div>
            </div>

            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>صافي الأرباح</p>
                <h2 style={cardValueStyle}>{netProfit.toLocaleString()} ج.م</h2>
                <span style={{ fontSize: '11px', color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  {netProfit >= 0 ? 'مكسب صافي' : 'عجز'}
                </span>
              </div>
              <div style={iconBoxStyle('#fef3c7')}>🏦</div>
            </div>
          </div>
        )}

        {/* 2. Students Tab */}
        {activeTab === 'students' && (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>الكود</th>
                  <th>اسم الطالب</th>
                  <th>المستوى</th>
                  <th>رقم ولي الأمر</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الحضور</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#6366f1' }}>#{s.id}</td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{s.name}</td>
                    <td style={{ padding: '12px' }}>{s.level}</td>
                    <td style={{ padding: '12px' }}>{s.parentPhone || 'غير مسجل'}</td>
                    <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>{s.paid} ج.م</td>
                    <td style={{ padding: '12px', color: '#f59e0b', fontWeight: 'bold' }}>{s.remaining} ج.م</td>
                    <td style={{ padding: '12px' }}>{s.attendanceCount} / 30 حصة</td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => handleDeleteStudent(s.id, s.name)} 
                        title="حذف الطالب"
                        style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            {/* Level Selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['المستوى الأول', 'المستوى الثاني', 'المستوى الثالث'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedAttendanceLevel(lvl)}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                    backgroundColor: selectedAttendanceLevel === lvl ? '#7c3aed' : '#fff',
                    color: selectedAttendanceLevel === lvl ? '#fff' : '#64748b',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th>الكود</th>
                    <th>اسم الطالب</th>
                    <th>الحصص المسجلة</th>
                    <th>تسجيل اليوم</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.level === selectedAttendanceLevel).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#6366f1' }}>#{s.id}</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{s.name}</td>
                      <td style={{ padding: '12px' }}>{s.attendanceCount} حصة</td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAttendance(s.id, 'present')} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}>✔️ حضور</button>
                        <button onClick={() => handleAttendance(s.id, 'absent')} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}>❌ غياب / خصم</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Installments & Accounts Tab */}
        {activeTab === 'finance' && (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>كود الطالب</th>
                  <th>اسم الطالب</th>
                  <th>المبلغ المدفوع</th>
                  <th>المبلغ المتبقي</th>
                  <th>تحصيل قسط جديد</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#6366f1' }}>#{s.id}</td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{s.name}</td>
                    <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>{s.paid} ج.م</td>
                    <td style={{ padding: '12px', color: '#f59e0b', fontWeight: 'bold' }}>{s.remaining} ج.م</td>
                    <td style={{ padding: '12px' }}>
                      {s.remaining > 0 ? (
                        <button
                          onClick={() => {
                            const amt = prompt(`أدخل المبلغ المحصل من الطالب ${s.name}:`, s.remaining)
                            if (amt) handlePayInstallment(s.id, amt)
                          }}
                          style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          💳 دفع قسط
                        </button>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>مسدد بالكامل ✔️</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Transactions Tab */}
        {activeTab === 'transactions' && (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th>النوع</th>
                  <th>البيان / الوصف</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: t.type === 'income' ? '#d1fae5' : '#fee2e2',
                        color: t.type === 'income' ? '#047857' : '#b91c1c'
                      }}>
                        {t.type === 'income' ? 'إيراد +' : 'مصروف -'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{t.title}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: t.type === 'income' ? '#10b981' : '#ef4444' }}>
                      {t.amount} ج.م
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal: Add Student */}
      {showAddStudentModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 20px 0' }}>إضافة طالب جديد</h3>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="كود الطالب (مثال: ST-105 أو 201)" required value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="اسم الطالب" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="رقم ولي الأمر" required value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} style={inputStyle} />
              <select value={newStudent.level} onChange={e => setNewStudent({...newStudent, level: e.target.value})} style={inputStyle}>
                <option>المستوى الأول</option>
                <option>المستوى الثاني</option>
                <option>المستوى الثالث</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="المدفوع" value={newStudent.paid} onChange={e => setNewStudent({...newStudent, paid: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="المتبقي" value={newStudent.remaining} onChange={e => setNewStudent({...newStudent, remaining: e.target.value})} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={primaryBtnStyle}>حفظ الطالب</button>
                <button type="button" onClick={() => setShowAddStudentModal(false)} style={cancelBtnStyle}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Transaction */}
      {showTransactionModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 20px 0' }}>تسجيل حركة مالية</h3>
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})} style={inputStyle}>
                <option value="expense">مصروف (-)</option>
                <option value="income">إيراد (+)</option>
              </select>
              <input type="text" placeholder="البيان / الوصف (مثال: إيجار المقر)" required value={newTransaction.title} onChange={e => setNewTransaction({...newTransaction, title: e.target.value})} style={inputStyle} />
              <input type="number" placeholder="المبلغ بالجنية" required value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} style={inputStyle} />
              <input type="date" value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={primaryBtnStyle}>تسجيل الحركة</button>
                <button type="button" onClick={() => setShowTransactionModal(false)} style={cancelBtnStyle}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

// Styles
const navBtnStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none',
  backgroundColor: active ? '#4f46e5' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'right', fontSize: '14px', fontWeight: '500'
})
const primaryBtnStyle = { backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }
const secondaryBtnStyle = { backgroundColor: '#059669', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }
const cancelBtnStyle = { backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', flex: 1 }
const cardStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
const cardTitleStyle = { margin: 0, fontSize: '12px', color: '#64748b' }
const cardValueStyle = { margin: '8px 0 4px 0', fontSize: '22px', color: '#0f172a' }
const iconBoxStyle = (bg) => ({ width: '48px', height: '48px', backgroundColor: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' })
const tableContainerStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' }
const tableHeaderStyle = { borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '14px', paddingBottom: '12px' }
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalContentStyle = { backgroundColor: '#fff', padding: '28px', borderRadius: '16px', width: '400px' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }

export default App
