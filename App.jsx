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
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f3f4f6' }}>
      
      {/* 1. New Compact Sidebar with Hover Style */}
      <aside style={{ width: '90px', backgroundColor: '#111827', color: '#fff', padding: '24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#6366f1', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)' }}>
            🎓
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {[
              { id: 'dashboard', icon: '📊', name: 'الرئيسية' },
              { id: 'students', icon: '👨‍🎓', name: 'الطلاب' },
              { id: 'attendance', icon: '📅', name: 'الحضور' },
              { id: 'finance', icon: '💳', name: 'الأقساط' },
              { id: 'transactions', icon: '📑', name: 'الخزينة' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.name}
                style={{
                  width: '100%', height: '56px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  backgroundColor: activeTab === item.id ? '#312e81' : 'transparent',
                  color: activeTab === item.id ? '#818cf8' : '#9ca3af',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <button onClick={() => supabase.auth.signOut()} title="تسجيل الخروج" style={{ width: '48px', height: '48px', borderRadius: '14px', border: 'none', backgroundColor: '#374151', color: '#f87171', cursor: 'pointer', fontSize: '18px' }}>
          🚪
        </button>
      </aside>

      {/* Main Content Viewport */}
      <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        
        {/* Top Floating Navbar with Integrated Search */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '16px 28px', borderRadius: '20px', marginBottom: '28px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>
              {activeTab === 'dashboard' && 'لوحة القيادة المباشرة'}
              {activeTab === 'students' && 'دليل وإدارة الطلاب'}
              {activeTab === 'attendance' && 'دفتر الحضور اليومي'}
              {activeTab === 'finance' && 'متابعة المستحقات والأقساط'}
              {activeTab === 'transactions' && 'السجل المالي والحركات'}
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>أكاديمية الناشئين - النظام الذكي</p>
          </div>

          {/* Integrated Search Input in Top Nav */}
          {activeTab === 'students' && (
            <div style={{ flex: '0 1 360px', position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 ابحث بالاسم، الكود، الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '13px', backgroundColor: '#f9fafb' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowAddStudentModal(true)} style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
              + طالب جديد
            </button>
            <button onClick={() => setShowTransactionModal(true)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              + قيد مالية
            </button>
          </div>
        </header>

        {/* 1. Dashboard View with Circular Indicators */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {[
                { title: 'إجمالي الطلاب', val: `${totalStudents} طالب`, color: '#6366f1', icon: '👨‍🎓' },
                { title: 'الإيرادات العامة', val: `${totalIncomes.toLocaleString()} ج.م`, color: '#10b981', icon: '💰' },
                { title: 'المصروفات', val: `${totalExpenses.toLocaleString()} ج.م`, color: '#ef4444', icon: '💸' },
                { title: 'صافي الأرباح', val: `${netProfit.toLocaleString()} ج.م`, color: '#f59e0b', icon: '🏦' }
              ].map((c, i) => (
                <div key={i} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.03)', borderTop: `4px solid ${c.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>{c.title}</span>
                    <span style={{ fontSize: '20px' }}>{c.icon}</span>
                  </div>
                  <h3 style={{ margin: '14px 0 0 0', fontSize: '22px', fontWeight: '800', color: '#111827' }}>{c.val}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Students View - Card Grid Layout Instead of Traditional Table */}
        {activeTab === 'students' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(s => (
                <div key={s.id} style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>#{s.id}</span>
                      <button onClick={() => handleDeleteStudent(s.id, s.name)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>🗑️ حذف</button>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#111827' }}>{s.name}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{s.level}</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#4b5563' }}>📱 ولي الأمر: {s.parentPhone || 'غير مسجل'}</p>
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>مدفوع: {s.paid}ج</span> / <span style={{ color: '#ef4444', fontWeight: 'bold' }}>متبقي: {s.remaining}ج</span>
                    </div>
                    <span style={{ backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>{s.attendanceCount}/30 حصة</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>لا توجد نتائج مطابقة</div>
            )}
          </div>
        )}

        {/* 3. Attendance View - Clean Level Selector Tabs */}
        {activeTab === 'attendance' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['المستوى الأول', 'المستوى الثاني', 'المستوى الثالث'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedAttendanceLevel(lvl)}
                  style={{
                    padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px',
                    backgroundColor: selectedAttendanceLevel === lvl ? '#111827' : '#fff',
                    color: selectedAttendanceLevel === lvl ? '#fff' : '#6b7280',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#9ca3af',
