import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

function PaycheckHistory({ user, onSelectPaycheck, onBack }) {
  const [paychecks, setPaychecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

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

  const handleSetCurrent = async (paycheck) => {
    setUpdating(true)
    try {
      // Set all paychecks to isCurrent: false
      for (const p of paychecks) {
        const budgetRef = doc(db, 'users', user.uid, 'budgets', p.id)
        await updateDoc(budgetRef, { isCurrent: false })
      }

      // Set this paycheck to isCurrent: true
      const budgetRef = doc(db, 'users', user.uid, 'budgets', paycheck.id)
      await updateDoc(budgetRef, { isCurrent: true })

      // Reload the list
      await loadPaychecks()
    } catch (err) {
      setError(err.message)
    }
    setUpdating(false)
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
                <span style={{ fontSize: '14px', color: paycheck.isCurrent ? 'green' : 'gray' }}>
                  ({paycheck.isCurrent ? 'Current' : 'Inactive'})
                </span>
              </h3>
              <p>
                {paycheck.date?.toDate?.()?.toLocaleDateString() || 'Date not available'}
              </p>
              <div>
                <button onClick={() => handleSetCurrent(paycheck)} style={{ marginRight: '5px', backgroundColor: paycheck.isCurrent ? '#4CAF50' : '#2196F3', color: 'white', cursor: 'pointer' }} disabled={updating}>
                  {paycheck.isCurrent ? '✓ Current' : 'Set as Current'}
                </button>
                <button onClick={(e) => {
                  e.stopPropagation()
                  onSelectPaycheck(paycheck)
                }} style={{ marginRight: '5px' }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PaycheckHistory
