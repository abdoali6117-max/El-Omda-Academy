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
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", backgroundColor: '#f1f5f9' }}>
      
      {/* Sidebar - الشريط الجانبي بتصميم داكن وعصري */}
      <aside style={{ width: '270px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '28px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '4px 0 24px rgba(0,0,0,0.05)' }}>
        <div>
          {/* Logo & Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px', padding: '0 8px' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}>⚡</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.3px', color: '#fff' }}>أكاديمية الناشئين</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>نظام الإدارة المتكامل</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>
              <span style={{ fontSize: '18px' }}>📊</span> لوحة التحكم
            </button>
            <button onClick={() => setActiveTab('students')} style={navBtnStyle(activeTab === 'students')}>
              <span style={{ fontSize: '18px' }}>🎓</span> إدارة الطلاب
            </button>
            <button onClick={() => setActiveTab('attendance')} style={navBtnStyle(activeTab === 'attendance')}>
              <span style={{ fontSize: '18px' }}>📅</span> الحضور والغياب
            </button>
            <button onClick={() => setActiveTab('finance')} style={navBtnStyle(activeTab === 'finance')}>
              <span style={{ fontSize: '18px' }}>💳</span> الأقساط والحسابات
            </button>
            <button onClick={() => setActiveTab('transactions')} style={navBtnStyle(activeTab === 'transactions')}>
              <span style={{ fontSize: '
