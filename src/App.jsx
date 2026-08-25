import { useState, useEffect } from 'react'
import { auth, db } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Login from './Login'
import StartPaycheck from './StartPaycheck'
import Dashboard from './Dashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(null)
  const [budgetLoading, setBudgetLoading] = useState(false)

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
  }

  const handlePaycheckCreated = () => {
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
          ) : budget ? (
            <>
              <Dashboard user={user} budget={budget} onBudgetUpdate={() => loadUserBudget(user.uid)} />
              <button onClick={handleLogout} style={{ marginTop: '20px' }}>
                Log Out
              </button>
            </>
          ) : (
            <StartPaycheck user={user} onPaycheckCreated={handlePaycheckCreated} />
          )}
        </div>
      ) : (
        <Login onLoginSuccess={() => {}} />
      )}
    </div>
  )
}

export default App