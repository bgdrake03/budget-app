import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, getDocs } from 'firebase/firestore'

function PaycheckHistory({ user, onSelectPaycheck, onBack }) {
  const [paychecks, setPaychecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPaychecks()
  }, [])

  const loadPaychecks = async () => {
    setLoading(true)
    setError('')
    try {
      const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'budgets'))
      const paycheckList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort by date, newest first
      paycheckList.sort((a, b) => b.date - a.date)
      setPaychecks(paycheckList)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (loading) return <p>Loading paychecks...</p>

  return (
    <div style={{ padding: '20px' }}>
      <h1>Paycheck History</h1>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>
        Back
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {paychecks.length === 0 ? (
        <p>No paychecks yet</p>
      ) : (
        <div>
          {paychecks.map(paycheck => (
            <div
              key={paycheck.id}
              style={{
                marginBottom: '15px',
                padding: '15px',
                border: '1px solid gray',
                cursor: 'pointer'
              }}
              onClick={() => onSelectPaycheck(paycheck)}
            >
              <h3>
                ${paycheck.amount.toFixed(2)} {' '}
                <span style={{ fontSize: '14px', color: paycheck.status === 'active' ? 'green' : 'gray' }}>
                  ({paycheck.status})
                </span>
              </h3>
              <p>
                {paycheck.date?.toDate?.()?.toLocaleDateString() || 'Date not available'}
              </p>
              <button onClick={(e) => {
                e.stopPropagation()
                onSelectPaycheck(paycheck)
              }}>
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PaycheckHistory
