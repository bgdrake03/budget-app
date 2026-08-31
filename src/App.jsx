import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import Login from './Login'
import Dashboard from './Dashboard'
import AllocateBudget from './AllocateBudget'
import { samplePaycheck } from './sampleData'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(null)
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [newPaycheck, setNewPaycheck] = useState(null)
  const [paycheckAmount, setPaycheckAmount] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        loadUserBudget(currentUser.uid)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const loadUserBudget = async (userId) => {
    setBudgetLoading(true)
    try {
      const q = query(
        collection(db, 'users', userId, 'budgets'),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        const budgetData = snapshot.docs[0]
        setBudget({
          id: budgetData.id,
          ...budgetData.data()
        })
      } else {
        setBudget(null)
      }
    } catch (err) {
      console.error('Error loading budget:', err)
    }
    setBudgetLoading(false)
  }

  const handleLogout = () => {
    signOut(auth)
    setBudget(null)
    setNewPaycheck(null)
    setPaycheckAmount('')
  }

  const handleCreatePaycheck = async (e) => {
    e.preventDefault()
    const amount = parseFloat(paycheckAmount)
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      // Create new paycheck with allocated amounts set to 0
      const paycheckData = {
        amount: amount,
        date: serverTimestamp(),
        status: 'pending_allocation',
        buckets: samplePaycheck.buckets.map(bucket => ({
          ...bucket,
          amount: (bucket.percentage / 100) * amount,
          categories: bucket.categories.map(category => ({
            ...category,
            allocated: 0,
            spent: 0
          }))
        }))
      }

      // Save to Firestore
      const docRef = await addDoc(
        collection(db, 'users', user.uid, 'budgets'),
        paycheckData
      )

      // Set new paycheck for allocation
      setNewPaycheck({
        id: docRef.id,
        ...paycheckData
      })
      setPaycheckAmount('')
    } catch (err) {
      alert('Error creating paycheck: ' + err.message)
    }
  }

  const handleAllocationComplete = () => {
    setNewPaycheck(null)
    loadUserBudget(user.uid)
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div>
      {user ? (
        <div>
          {budgetLoading ? (
            <p>Loading budget...</p>
          ) : newPaycheck ? (
            <AllocateBudget user={user} paycheck={newPaycheck} onAllocationComplete={handleAllocationComplete} />
          ) : budget ? (
            <>
              <Dashboard user={user} budget={budget} onBudgetUpdate={() => loadUserBudget(user.uid)} />
              <button onClick={handleLogout} style={{ marginTop: '20px' }}>
                Log Out
              </button>
            </>
          ) : (
            <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
              <h1>Budget App</h1>
              <h2>Create New Paycheck</h2>
              <form onSubmit={handleCreatePaycheck}>
                <div>
                  <label>Paycheck Amount: $</label>
                  <input
                    type="number"
                    value={paycheckAmount}
                    onChange={(e) => setPaycheckAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <button type="submit">Create Paycheck</button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <Login onLoginSuccess={() => {}} />
      )}
    </div>
  )
}

export default App