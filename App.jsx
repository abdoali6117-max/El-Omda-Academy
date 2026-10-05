import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedAttendanceLevel, setSelectedAttendanceLevel] = useState('المستوى الأول')

  // حقل حالة البحث عن الطلاب
  const [searchTerm, setSearchTerm] = useState('')

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

  // تصفية قائمة الطلاب بناءً على البحث
  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase().trim()
    return (
      student.name.toLowerCase().includes(term) ||
      String(student.id).toLowerCase().includes(term) ||
      (student.parentPhone && student.parentPhone.includes(term))
    )
  })

  // إضافة طالب جديد بكود مخصص
  const handleAddStudent = (e) => {
    e.preventDefault()
    if (!newStudent.name || !newStudent.id) {
      alert('يرجى كتابة اسم الطالب وكود الطالب!')
      return
    }

    const exists = students.some(s => String(s.id) === String(newStudent.id))
    if (exists) {
      alert('كود الطالب هذا مستخدم بالفعل، يرجى كتابة كود مختلف.')
      return
    }

    const createdStudent = { ...newStudent, attendanceCount: 0 }
    setStudents([...students, createdStudent])
    
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

  // حذف الطالب
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
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', fontFamily: "'Segoe UI', Tahoma, sans-serif", backgroundColor: '#f1f5f9' }}>
      
      {/* Sidebar - الشريط الجانبي */}
      <aside style={{ width: '270px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '28px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 24px rgba(0,0,0,0.05)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px', padding: '0 8px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>⚡</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#fff' }}>أكاديمية الناشئين</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>نظام الإدارة المتكامل</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>
              📊 لوحة التحكم
            </button>
            <button onClick={() => setActiveTab('students')} style={navBtnStyle(activeTab === 'students')}>
              🎓 إدارة الطلاب
            </button>
            <button onClick={() => setActiveTab('attendance')} style={navBtnStyle(activeTab === 'attendance')}>
              📅 الحضور والغياب
            </button>
            <button onClick={() => setActiveTab('finance')} style={navBtnStyle(activeTab === 'finance')}>
              💳 الأقساط والحسابات
            </button>
            <button onClick={() => setActiveTab('transactions')} style={navBtnStyle(activeTab === 'transactions')}>
              📝 السجل المالي
            </button>
          </nav>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>المسؤول (Admin)</span>
          <button onClick={() => supabase.auth.signOut()} style={{ background: '#1e293b', border: 'none', color: '#f87171', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>🚪</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>
              {activeTab === 'dashboard' && 'لوحة التحكم الرئيسية'}
              {activeTab === 'students' && 'إدارة الطلاب'}
              {activeTab === 'attendance' && 'تسجيل الحضور والغياب'}
              {activeTab === 'finance' && 'كشف الأقساط والحسابات'}
              {activeTab === 'transactions' && 'دفتر الإيرادات والمصروفات'}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowAddStudentModal(true)} style={primaryBtnStyle}>+ إضافة طالب</button>
            <button onClick={() => setShowTransactionModal(true)} style={secondaryBtnStyle}>+ حركة مالية</button>
          </div>
        </div>

        {/* 1. Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>إجمالي الطلاب</p>
                <h2 style={cardValueStyle}>{totalStudents}</h2>
                <span style={badgeStyle('#e0e7ff', '#4338ca')}>طالب مسجل</span>
              </div>
              <div style={iconBoxStyle('#e0e7ff')}>👥</div>
            </div>

            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>إجمالي الإيرادات</p>
                <h2 style={cardValueStyle}>{totalIncomes.toLocaleString()} ج.م</h2>
                <span style={badgeStyle('#d1fae5', '#047857')}>المقبوضات</span>
              </div>
              <div style={iconBoxStyle('#d1fae5')}>💵</div>
            </div>

            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>إجمالي المصروفات</p>
                <h2 style={cardValueStyle}>{totalExpenses.toLocaleString()} ج.م</h2>
                <span style={badgeStyle('#fee2e2', '#b91c1c')}>المصاريف</span>
              </div>
              <div style={iconBoxStyle('#fee2e2')}>📉</div>
            </div>

            <div style={cardStyle}>
              <div>
                <p style={cardTitleStyle}>صافي الأرباح</p>
                <h2 style={cardValueStyle}>{netProfit.toLocaleString()} ج.م</h2>
                <span style={badgeStyle(netProfit >= 0 ? '#d1fae5' : '#fee2e2', netProfit >= 0 ? '#047857' : '#b91c1c')}>
                  {netProfit >= 0 ? 'صافي أرباح' : 'عجز'}
                </span>
              </div>
              <div style={iconBoxStyle('#fef3c7')}>🏦</div>
            </div>
          </div>
        )}

        {/* 2. Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="ابحث باسم الطالب، الكود، أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={clearSearchBtnStyle}>
                  إلغاء البحث
                </button>
              )}
            </div>

            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={{ padding: '16px' }}>كود الطالب</th>
                    <th style={{ padding: '16px' }}>الاسم</th>
                    <th style={{ padding: '16px' }}>المستوى</th>
                    <th style={{ padding: '16px' }}>رقم ولي الأمر</th>
                    <th style={{ padding: '16px' }}>المدفوع</th>
                    <th style={{ padding: '16px' }}>المتبقي</th>
                    <th style={{ padding: '16px' }}>الحضور</th>
                    <th style={{ padding: '16px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(s => (
                      <tr key={s.id} style={tableRowStyle}>
                        <td style={{ padding: '16px', fontWeight: '700', color: '#4f46e5' }}>#{s.id}</td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>{s.name}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={badgeStyle('#f1f5f9', '#475569')}>{s.level}</span>
                        </td>
                        <td style={{ padding: '16px', color: '#64748b' }}>{s.parentPhone || 'غير مسجل'}</td>
                        <td style={{ padding: '16px', color: '#059669', fontWeight: '700' }}>{s.paid} ج.م</td>
                        <td style={{ padding: '16px', color: '#d97706', fontWeight: '700' }}>{s.remaining} ج.م</td>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{s.attendanceCount} / 30 حصة</td>
                        <td style={{ padding: '16px' }}>
                          <button onClick={() => handleDeleteStudent(s.id, s.name)} style={deleteBtnStyle}>🗑️ حذف</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        لا توجد نتائج مطابقة لـ "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {['المستوى الأول', 'المستوى الثاني', 'المستوى الثالث'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedAttendanceLevel(lvl)}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', border: '1px solid transparent', cursor: 'pointer', fontWeight: '600',
                    backgroundColor: selectedAttendanceLevel === lvl ? '#4f46e5' : '#fff',
                    color: selectedAttendanceLevel === lvl ? '#fff' : '#64748b',
                    borderColor: selectedAttendanceLevel === lvl ? '#4f46e5' : '#e2e8f0'
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
                    <th style={{ padding: '16px' }}>الكود</th>
                    <th style={{ padding: '16px' }}>اسم الطالب</th>
                    <th style={{ padding: '16px' }}>إجمالي الحضور</th>
                    <th style={{ padding: '16px' }}>تسجيل اليوم</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.level === selectedAttendanceLevel).map(s => (
                    <tr key={s.id} style={tableRowStyle}>
                      <td style={{ padding: '16px', fontWeight: '700', color: '#4f46e5' }}>#{s.id}</td>
                      <td style={{ padding: '16px', fontWeight: '600' }}>{s.name}</td>
                      <td style={{ padding: '16px', fontWeight: '600' }}>{s.attendanceCount} حصة</td>
                      <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleAttendance(s.id, 'present')} style={actionBtnStyle('#10b981')}>✔️ حضور</button>
                        <button onClick={() => handleAttendance(s.id, 'absent')} style={actionBtnStyle('#ef4444')}>❌ غياب / خصم</button>
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
                  <th style={{ padding: '16px' }}>الكود</th>
                  <th style={{ padding: '16px' }}>اسم الطالب</th>
                  <th style={{ padding: '16px' }}>المدفوع</th>
                  <th style={{ padding: '16px' }}>المتبقي</th>
                  <th style={{ padding: '16px' }}>تحصيل قسط</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={tableRowStyle}>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#4f46e5' }}>#{s.id}</td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{s.name}</td>
                    <td style={{ padding: '16px', color: '#059669', fontWeight: '700' }}>{s.paid} ج.م</td>
                    <td style={{ padding: '16px', color: '#d97706', fontWeight: '700' }}>{s.remaining} ج.م</td>
                    <td style={{ padding: '16px' }}>
                      {s.remaining > 0 ? (
                        <button
                          onClick={() => {
                            const amt = prompt(`أدخل المبلغ المحصل من الطالب ${s.name}:`, s.remaining)
                            if (amt) handlePayInstallment(s.id, amt)
                          }}
                          style={actionBtnStyle('#f59e0b')}
                        >
                          💳 دفع قسط
                        </button>
                      ) : (
                        <span style={badgeStyle('#d1fae5', '#047857')}>مسدد بالكامل ✔️</span>
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
                  <th style={{ padding: '16px' }}>النوع</th>
                  <th style={{ padding: '16px' }}>البيان / الوصف</th>
                  <th style={{ padding: '16px' }}>المبلغ</th>
                  <th style={{ padding: '16px' }}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={tableRowStyle}>
                    <td style={{ padding: '16px' }}>
                      <span style={badgeStyle(t.type === 'income' ? '#d1fae5' : '#fee2e2', t.type === 'income' ? '#047857' : '#b91c1c')}>
                        {t.type === 'income' ? 'إيراد +' : 'مصروف -'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{t.title}</td>
                    <td style={{ padding: '16px', fontWeight: '700', color: t.type === 'income' ? '#059669' : '#dc2626' }}>
                      {t.amount} ج.م
                    </td>
                    <td style={{ padding: '16px', color: '#64748b' }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* Modal: Add Student */}
      {showAddStudentModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 20px 0' }}>إضافة طالب جديد</h3>
            <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input type="text" placeholder="كود الطالب (مثال: ST-105)" required value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} style={inputStyle} />
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
            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <select value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})} style={inputStyle}>
                <option value="expense">مصروف (-)</option>
                <option value="income">إيراد (+)</option>
              </select>
              <input type="text" placeholder="البيان / الوصف" required value={newTransaction.title} onChange={e => setNewTransaction({...newTransaction, title: e.target.value})} style={inputStyle} />
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
  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none',
  backgroundColor: active ? '#4f46e5' : 'transparent', color: active ? '#fff' : '#94a3b8', cursor: 'pointer', textAlign: 'right', fontSize: '14px', fontWeight: '600'
})
const primaryBtnStyle = { background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }
const secondaryBtnStyle = { background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }
const cancelBtnStyle = { backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', flex: 1 }
const deleteBtnStyle = { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
const actionBtnStyle = (bg) => ({ backgroundColor: bg, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' })
const cardStyle = { backgroundColor: '#fff', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }
const cardTitleStyle = { margin: 0, fontSize: '13px', color: '#64748b' }
const cardValueStyle = { margin: '8px 0', fontSize: '24px', color: '#0f172a', fontWeight: '800' }
const iconBoxStyle = (bg) => ({ width: '52px', height: '52px', backgroundColor: bg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' })
const badgeStyle = (bg, text) => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: bg, color: text })
const tableContainerStyle = { backgroundColor: '#fff', padding: '12px', borderRadius: '16px', overflow: 'hidden' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' }
const tableHeaderStyle = { backgroundColor: '#f8fafc', color: '#64748b', fontSize: '13px' }
const tableRowStyle = { borderBottom: '1px solid #f1f5f9' }
const searchInputStyle = { width: '100%', maxWidth: '400px', padding: '12px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }
const clearSearchBtnStyle = { padding: '10px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', cursor: 'pointer', fontSize: '13px' }
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
const modalContentStyle = { backgroundColor: '#fff', padding: '32px', borderRadius: '20px', width: '420px' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' }

export default App
