import { useState } from 'react'
import { db } from './firebase'
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'

function Dashboard({ user, budget, onBudgetUpdate }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [spendAmount, setSpendAmount] = useState('')
  const [spendNote, setSpendNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSpend = async (categoryId, amount) => {
    setLoading(true)
    setError('')

    try {
      // Find the category to get its name
      let categoryName = ''
      budget.buckets.forEach(bucket => {
        const category = bucket.categories.find(c => c.id === categoryId)
        if (category) categoryName = category.name
      })

      // Create transaction document
      await addDoc(
        collection(db, 'users', user.uid, 'budgets', budget.id, 'transactions'),
        {
          categoryId: categoryId,
          categoryName: categoryName,
          amount: amount,
          note: spendNote,
          date: serverTimestamp()
        }
      )

      // Update budget with new spent amount
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

    const amount = parseFloat(spendAmount)

    // Find the category to check remaining balance
    let category = null
    budget.buckets.forEach(bucket => {
      const found = bucket.categories.find(c => c.id === selectedCategoryId)
      if (found) category = found
    })

    if (category) {
      const remaining = category.allocated - category.spent
      if (amount > remaining) {
        const confirmOverspend = window.confirm(
          `⚠️ Warning: You only have $${remaining.toFixed(2)} remaining in "${category.name}".

You are about to spend $${amount.toFixed(2)}, which exceeds your budget.

Would you like to proceed anyway? (You can re-allocate your budget later.)`
        )

        if (!confirmOverspend) {
          return
        }
      }
    }

    handleSpend(selectedCategoryId, amount)
    setSpendAmount('')
    setSpendNote('')
    setSelectedCategoryId(null)
  }

  return (
    <div>
      <h1>Budget Dashboard</h1>
      <p>Total Income: ${budget.amount.toFixed(2)}</p>

      <div className="dashboard-layout">
        {/* SPENDING FORM */}
        <div className="dashboard-form">
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

              <div>
                <label>Note (optional): </label>
                <input
                  type="text"
                  value={spendNote}
                  onChange={(e) => setSpendNote(e.target.value)}
                  placeholder="e.g., Walmart groceries"
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Log Spending'}
              </button>
            </form>
            {error && <p style={{ color: '#EC4899' }}>{error}</p>}
          </div>
        </div>

        {/* BUDGET DISPLAY */}
        <div className="dashboard-buckets">
          {budget.buckets.map((bucket) => (
            <div key={bucket.id} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
              <h2>{bucket.name}</h2>
              <p>Total: ${bucket.amount.toFixed(2)}</p>

              <ul>
                {bucket.categories.map((category) => (
                  <li key={category.id}>
                    {category.name}: ${category.allocated} (Spent: ${category.spent}, Remaining: ${category.allocated - category.spent})
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard