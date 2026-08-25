import { useState, useEffect } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import Login from './Login'
import Dashboard from './Dashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in when app loads
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleLogout = () => {
    signOut(auth)
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div>
      {user ? (
        <div>
          <Dashboard user={user} />
          <button onClick={handleLogout} style={{ marginTop: '20px' }}>
            Log Out
          </button>
        </div>
      ) : (
        <Login onLoginSuccess={() => {}} />
      )}
    </div>
  )
}

export default App