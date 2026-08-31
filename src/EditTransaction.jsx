import { useState } from 'react'
import { db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'

function EditTransaction({ user, transaction, onSave, onBack }) {
  const [amount, setAmount] = useState(transaction.amount.toString())
  const [note, setNote] = useState(transaction.note || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    const newAmount = parseFloat(amount)

    if (!newAmount || newAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')

    try {
      const transactionRef = doc(
        db,
        'users',
        user.uid,
        'budgets',
        transaction.budgetId,
        'transactions',
        transaction.id
      )

      await updateDoc(transactionRef, {
        amount: newAmount,
        note: note
      })

      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto' }}>
      <h1>Edit Transaction</h1>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>
        Back
      </button>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid gray' }}>
        <h3>{transaction.categoryName}</h3>
        <p style={{ fontSize: '12px', color: 'gray' }}>
          {transaction.date?.toDate?.()?.toLocaleDateString()}
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label>Amount: $</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Note:</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Walmart groceries"
            style={{ width: '100%' }}
          />
        </div>

        <button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  )
}

export default EditTransaction
