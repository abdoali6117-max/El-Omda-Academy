import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

// مصفوفة لتوليد 250 طالب عشوائي تلقائياً
const generateRandomStudents = () => {
  const firstNames = ['أحمد', 'محمود', 'علي', 'عمر', 'حسين', 'إبراهيم', 'مصطفى', 'يوسف', 'خالد', 'حسن', 'سارة', 'مريم', 'نور', 'فاطمة', 'آية', 'زينب', 'رنا', 'منى', 'ياسمين', 'هدى']
  const familyNames = ['السيد', 'عبدالله', 'محمد', 'العمدة', 'الشريف', 'حسن', 'إبراهيم', 'عثمان', 'جمال', 'كمال', 'فاروق', 'توفيق', 'صالح', 'رضا', 'فهمي']
  const levels = ['المستوى الأول', 'المستوى الثاني', 'المستوى الثالث']
  
  const generated = []
  for (let i = 1; i <= 250; i++) {
    const id = String(100 + i)
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${familyNames[Math.floor(Math.random() * familyNames.length)]}`
    const level = levels[Math.floor(Math.random() * levels.length)]
    const parentPhone = `01${Math.floor(Math.random() * 3)}${Math.floor(10000000 + Math.random() * 90000000)}`
    
    // حسابات مالية وحضور عشوائية
    const isPaidFull = Math.random() > 0.4
    const paid = isPaidFull ? 1500 : Math.floor(Math.random() * 3) * 500
    const remaining = 1500 - paid
    const attendanceCount = Math.floor(Math.random() * 25)

    generated.push({ id, name, level, parentPhone, paid, remaining, attendanceCount })
  }
  return generated
}

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedAttendanceLevel, setSelectedAttendanceLevel] = useState('المستوى الأول')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. قاعدة بيانات الـ 250 طالب
  const [students, setStudents] = useState(generateRandomStudents())

  // 2. بيانات المعاملات المالية
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'income', title: 'اشتراك المستوى الأول - دفعة أكتوبر', amount: 45000, date: '2026-10-01' },
    { id: 2, type: 'income', title: 'تحصيل أقساط متبقية', amount: 15500, date: '2026-10-02' },
    { id: 3, type: 'expense', title: 'إيجار المقر الشهري', amount: 5000, date: '2026-10-03' },
    { id: 4, type: 'expense', title: 'أدوات ومستلزمات تدريب وتربيه رياضية', amount: 3200, date: '2026-10-04' }
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

  // الحسابات والتجميع الإجمالي لـ 250 طالب
  const totalStudents = students.length
  const totalStudentPayments = students.reduce((acc, s) => acc + Number(s.paid || 0), 0)
  const totalIncomes = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0) + totalStudentPayments
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

  const handleDeleteTransaction = (id, title) => {
    if (window.confirm(`هل أنت تأكد من حذف الحركة المالية "${title}"؟`)) {
      setTransactions(transactions.filter(t => t.id !== id))
    }
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
      
      {/* 1. Top Horizontal Navigation Bar */}
      <header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚡</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>أكاديمية العمدة</h2>
            <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: '600' }}>v2.0 (250 طالب)</span>
          </div>
        </div>

        {/* Horizontal Navigation Buttons */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'dashboard', icon: '📊', name: 'لوحة القيادة' },
            { id: 'students', icon: '👨‍🎓', name: `إدارة الطلاب (${students.length})` },
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
                cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', transition: 'all 0.2s'
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
              { title: 'إجمالي الطلاب المسجلين', val: `${totalStudents} طالب`, color: '#6366f1' },
              { title: 'إجمالي الإيرادات المقبوضة', val: `${totalIncomes.toLocaleString()} ج.م`, color: '#34d399' },
              { title: 'إجمالي المصروفات', val: `${totalExpenses.toLocaleString()} ج.م`, color: '#f87171' },
              { title: 'صافي الخزينة / الأرباح', val: `${netProfit.toLocaleString()} ج.م`, color: '#fbbf24' }
            ].map((card, i) => (
              <div key={i} style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{card.title}</span>
                <h2 style={{ margin: 0, fontSize: '26px', color: card.color }}>{card.val}</h2>
              </div>
            ))}
          </div>
        )}

        {/* 2. Students View */}
        {activeTab === 'students
