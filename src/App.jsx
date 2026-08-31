import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, getDoc } from 'firebase/firestore'
import Login from './Login'
import Dashboard from './Dashboard'
import AllocateBudget from './AllocateBudget'
import PaycheckHistory from './PaycheckHistory'
import EditPaycheck from './EditPaycheck'
import TransactionHistory from './TransactionHistory'
import EditTransaction from './EditTransaction'
import CategoryManager from './CategoryManager'
import AdjustSpending from './AdjustSpending'
import { samplePaycheck } from './sampleData'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(null)
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [newPaycheck, setNewPaycheck] = useState(null)
  const [paycheckAmount, setPaycheckAmount] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPaycheckHistory, setShowPaycheckHistory] = useState(false)
  const [editingPaycheck, setEditingPaycheck] = useState(null)
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showAdjustSpending, setShowAdjustSpending] = useState(false)

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
        where('isCurrent', '==', true)
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        let budgetData = snapshot.docs[0].data()

        // Load settings categories to merge updated goals/types
        try {
          const settingsRef = doc(db, 'users', userId, 'settings', 'categories')
          const settingsDoc = await getDoc(settingsRef)

          if (settingsDoc.exists()) {
            const settingsBuckets = settingsDoc.data().buckets

            // Merge settings into budget categories
            budgetData = {
              ...budgetData,
              buckets: budgetData.buckets.map(bucket => {
                const settingsBucket = settingsBuckets.find(sb => sb.id === bucket.id)
                if (!settingsBucket) return bucket

                return {
                  ...bucket,
                  categories: bucket.categories.map(category => {
                    const settingsCategory = settingsBucket.categories.find(sc => sc.id === category.id)
                    if (!settingsCategory) return category

                    const type = settingsCategory.type || 'spending'
                    const updated = {
                      ...category,
                      type
                    }
                    if (type === 'savings' && typeof settingsCategory.goal === 'number') {
                      updated.goal = settingsCategory.goal
                    }
                    return updated
                  })
                }
              })
            }
          }
        } catch (err) {
          console.log('Could not load settings categories:', err)
        }

        setBudget({
          id: snapshot.docs[0].id,
          ...budgetData
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
      // Load custom categories or use defaults
      let bucketsToUse = samplePaycheck.buckets

      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'categories')
        const settingsDoc = await getDoc(settingsRef)

        if (settingsDoc.exists()) {
          bucketsToUse = settingsDoc.data().buckets
        }
      } catch (err) {
        // If error loading custom categories, use defaults
        console.log('Using default categories')
      }

      // Create new paycheck with allocated amounts set to 0
      const paycheckData = {
        amount: amount,
        date: serverTimestamp(),
        status: 'pending_allocation',
        isCurrent: true,
        buckets: bucketsToUse.map(bucket => ({
          id: bucket.id,
          name: bucket.name,
          percentage: bucket.percentage,
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

  const clearAllData = async () => {
    if (!window.confirm('Are you sure? This will delete ALL paychecks. This cannot be undone.')) {
      return
    }

    try {
      const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'budgets'))

      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(db, 'users', user.uid, 'budgets', docSnap.id))
      }

      setBudget(null)
      setNewPaycheck(null)
      alert('All data cleared!')
    } catch (err) {
      alert('Error clearing data: ' + err.message)
    }
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
          ) : showAdjustSpending ? (
            <AdjustSpending
              user={user}
              budget={budget}
              onBack={() => setShowAdjustSpending(false)}
              onSave={() => {
                setShowAdjustSpending(false)
                loadUserBudget(user.uid)
              }}
            />
          ) : showCategoryManager ? (
            <CategoryManager
              user={user}
              onBack={() => setShowCategoryManager(false)}
              onCategoriesUpdate={() => loadUserBudget(user.uid)}
            />
          ) : editingTransaction ? (
            <EditTransaction
              user={user}
              transaction={editingTransaction}
              onSave={() => {
                setEditingTransaction(null)
                loadUserBudget(user.uid)
              }}
              onBack={() => setEditingTransaction(null)}
            />
          ) : showTransactionHistory ? (
            <TransactionHistory
              user={user}
              onBack={() => setShowTransactionHistory(false)}
              onSelectTransaction={(transaction) => setEditingTransaction(transaction)}
              onTransactionDelete={() => loadUserBudget(user.uid)}
            />
          ) : editingPaycheck ? (
            <EditPaycheck
              user={user}
              paycheck={editingPaycheck}
              onSave={() => {
                setEditingPaycheck(null)
                setShowPaycheckHistory(false)
                loadUserBudget(user.uid)
              }}
              onBack={() => setEditingPaycheck(null)}
            />
          ) : showPaycheckHistory ? (
            <PaycheckHistory
              user={user}
              onSelectPaycheck={(paycheck) => setEditingPaycheck(paycheck)}
              onBack={() => setShowPaycheckHistory(false)}
            />
          ) : newPaycheck ? (
            <AllocateBudget user={user} paycheck={newPaycheck} onAllocationComplete={handleAllocationComplete} />
          ) : showCreateForm ? (
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
                <button type="button" onClick={() => setShowCreateForm(false)} style={{ marginLeft: '10px' }}>
                  Cancel
                </button>
              </form>
            </div>
          ) : budget ? (
            <>
              <Dashboard user={user} budget={budget} onBudgetUpdate={() => loadUserBudget(user.uid)} />
              <div className="dashboard-buttons">
                <button onClick={() => setShowCreateForm(true)}>
                  New Paycheck
                </button>
                <button onClick={() => setShowPaycheckHistory(true)}>
                  Paycheck History
                </button>
                <button onClick={() => setShowTransactionHistory(true)}>
                  Transaction History
                </button>
                <button onClick={() => setShowAdjustSpending(true)}>
                  Adjust Spending
                </button>
                <button onClick={() => setShowCategoryManager(true)}>
                  Manage Categories
                </button>
                <button onClick={clearAllData} style={{ backgroundColor: '#EC4899', color: 'white' }}>
                  Clear All Data (Testing)
                </button>
                <button onClick={handleLogout}>
                  Log Out
                </button>
              </div>
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