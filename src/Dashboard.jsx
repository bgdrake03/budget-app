import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { samplePaycheck } from './sampleData'

function Dashboard({ user }) {
  const [budget, setBudget] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [spendAmount, setSpendAmount] = useState('')
  const [loading, setLoading] = useState(true)

  // Load budget data from Firestore when component mounts
  useEffect(() => {
    const loadBudget = async () => {
      try {
        const budgetRef = doc(db, 'users', user.uid, 'budgets', 'current')
        const docSnap = await getDoc(budgetRef)

        if (docSnap.exists()) {
          // Budget exists, load it
          setBudget(docSnap.data())
        } else {
          // No budget exists, create one with sample data
          await setDoc(budgetRef, samplePaycheck)
          setBudget(samplePaycheck)
        }
      } catch (error) {
        console.error('Error loading budget:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBudget()
  }, [user.uid])

  const handleSpend = async (categoryId, amount) => {
    if (!budget) return

    const updatedBudget = JSON.parse(JSON.stringify(budget))

    updatedBudget.buckets.forEach(bucket => {
      bucket.categories.forEach(category => {
        if (category.id === categoryId) {
          category.spent += amount
        }
      })
    })

    setBudget(updatedBudget)

    // Save to Firestore
    try {
      const budgetRef = doc(db, 'users', user.uid, 'budgets', 'current')
      await updateDoc(budgetRef, updatedBudget)
    } catch (error) {
      console.error('Error saving budget:', error)
    }
  }

  const handleSubmitSpending = (e) => {
    e.preventDefault()

    if (!selectedCategoryId || !spendAmount) {
      alert('Please select a category and enter an amount')
      return
    }

    handleSpend(selectedCategoryId, parseFloat(spendAmount))
    setSpendAmount('')
    setSelectedCategoryId(null)
  }

  if (loading) {
    return <p>Loading your budget...</p>
  }

  if (!budget) {
    return <p>Error loading budget</p>
  }

  return (
    <div>
      <h1>Budget Dashboard</h1>
      <p>Total Income: ${budget.amount.toFixed(2)}</p>

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
            />
          </div>

          <button type="submit">Log Spending</button>
        </form>
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

export default Dashboard