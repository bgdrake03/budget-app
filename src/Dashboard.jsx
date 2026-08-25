import { useState } from 'react'
import { db } from './firebase'
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore'
import { samplePaycheck } from './sampleData'

function Dashboard({ user, budget, onBudgetUpdate }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [spendAmount, setSpendAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewPaycheck, setShowNewPaycheck] = useState(false)

  const handleSpend = async (categoryId, amount) => {
    setLoading(true)
    setError('')

    try {
      const updatedBuckets = budget.buckets.map(bucket => ({
        ...bucket,
        categories: bucket.categories.map(category => {
          if (category.id === categoryId) {
            return { ...category, spent: category.spent + amount }
          }
          return category
        })
      }))

      const budgetRef = doc(db, 'users', user.uid, 'budgets', budget.id)
      await updateDoc(budgetRef, {
        buckets: updatedBuckets
      })

      onBudgetUpdate()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSpending = (e) => {
    e.preventDefault()

    if (!selectedCategoryId || !spendAmount) {
      setError('Please select a category and enter an amount')
      return
    }

    handleSpend(selectedCategoryId, parseFloat(spendAmount))
    setSpendAmount('')
    setSelectedCategoryId(null)
  }

  return (
    <div>
      <h1>Budget Dashboard</h1>
      <p>Total Income: ${budget.amount.toFixed(2)}</p>
      
      <button onClick={() => setShowNewPaycheck(!showNewPaycheck)} style={{ marginBottom: '20px' }}>
        New Paycheck
      </button>

      {showNewPaycheck && (
        <NewPaycheckForm user={user} onPaycheckCreated={() => {
          setShowNewPaycheck(false)
          onBudgetUpdate()
        }} />
      )}

      {/* SPENDING FORM */}
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid gray' }}>
        <h3>Log Spending</h3>
        <form onSubmit={handleSubmitSpending}>
          <div>
            <label>Category: </label>
            <select value={selectedCategoryId || ''} onChange={(e) => setSelectedCategoryId(Number(e.target.value))}>
              <option value="">-- Select a category --</option>
              {budget.buckets.map(bucket =>
                bucket.categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label>Amount: $</label>
            <input
              type="number"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Log Spending'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      {/* BUDGET DISPLAY */}
      <div>
        {budget.buckets.map((bucket) => (
          <div key={bucket.id}>
            <h2>{bucket.name}</h2>
            <p>Total: ${bucket.amount.toFixed(2)}</p>

            <ul>
              {bucket.categories.map((category) => (
                <li key={category.id}>
                  {category.name}: ${category.budget} (Remaining: ${category.budget - category.spent})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewPaycheckForm({ user, onPaycheckCreated }) {
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

      const newBudget = {
        amount: paycheckAmount,
        date: new Date(),
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

      await addDoc(collection(db, 'users', user.uid, 'budgets'), newBudget)

      setAmount('')
      onPaycheckCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid blue' }}>
      <h3>Create New Paycheck</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Paycheck amount"
          step="0.01"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default Dashboard