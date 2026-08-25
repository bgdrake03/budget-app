import { useState } from 'react'
import { db } from './firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { samplePaycheck } from './sampleData'

function StartPaycheck({ user, onPaycheckCreated }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const paycheckAmount = parseFloat(amount)
      if (!paycheckAmount || paycheckAmount <= 0) {
        setError('Please enter a valid amount')
        return
      }

      // Create new budget cycle with calculated buckets
      const newBudget = {
        amount: paycheckAmount,
        date: serverTimestamp(),
        status: 'active',
        buckets: samplePaycheck.buckets.map(bucket => ({
          ...bucket,
          amount: (bucket.percentage / 100) * paycheckAmount,
          categories: bucket.categories.map(category => ({
            ...category,
            spent: 0
          }))
        }))
      }

      // Save to Firestore
      const docRef = await addDoc(
        collection(db, 'users', user.uid, 'budgets'),
        newBudget
      )

      setAmount('')
      onPaycheckCreated(docRef.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Budget App</h1>
      <h2>Start New Paycheck</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Paycheck Amount: $</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Budget'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default StartPaycheck