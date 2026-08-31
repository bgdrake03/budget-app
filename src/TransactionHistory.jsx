import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

function TransactionHistory({ user, onBack, onSelectTransaction, onTransactionDelete }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    setError('')
    try {
      const allTransactions = []

      // Get all budgets
      const budgetsSnapshot = await getDocs(collection(db, 'users', user.uid, 'budgets'))

      // For each budget, get all transactions
      for (const budgetDoc of budgetsSnapshot.docs) {
        const transactionsSnapshot = await getDocs(
          collection(db, 'users', user.uid, 'budgets', budgetDoc.id, 'transactions')
        )

        transactionsSnapshot.docs.forEach(transDoc => {
          allTransactions.push({
            id: transDoc.id,
            budgetId: budgetDoc.id,
            budgetAmount: budgetDoc.data().amount,
            ...transDoc.data()
          })
        })
      }

      // Sort by date, newest first
      allTransactions.sort((a, b) => b.date - a.date)
      setTransactions(allTransactions)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleDelete = async (budgetId, transactionId) => {
    if (!window.confirm('Delete this transaction?')) return

    try {
      await deleteDoc(
        doc(db, 'users', user.uid, 'budgets', budgetId, 'transactions', transactionId)
      )
      setTransactions(transactions.filter(t => t.id !== transactionId))
      if (onTransactionDelete) {
        onTransactionDelete()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Loading transactions...</p>

  return (
    <div style={{ padding: '20px' }}>
      <h1>Transaction History</h1>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>
        Back
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {transactions.length === 0 ? (
        <p>No transactions yet</p>
      ) : (
        <div>
          {transactions.map(transaction => (
            <div
              key={transaction.id}
              style={{
                marginBottom: '10px',
                padding: '10px',
                border: '1px solid gray',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                    {transaction.categoryName}: ${transaction.amount.toFixed(2)}
                  </p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: 'gray' }}>
                    {transaction.date?.toDate?.()?.toLocaleDateString()} {transaction.date?.toDate?.()?.toLocaleTimeString()}
                  </p>
                  {transaction.note && (
                    <p style={{ margin: '0', fontSize: '12px', fontStyle: 'italic' }}>
                      Note: {transaction.note}
                    </p>
                  )}
                  <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>
                    Paycheck: ${transaction.budgetAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => onSelectTransaction(transaction)}
                    style={{ backgroundColor: '#4CAF50', color: 'white', padding: '5px 10px', marginRight: '5px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.budgetId, transaction.id)}
                    style={{ backgroundColor: '#ff6b6b', color: 'white', padding: '5px 10px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TransactionHistory
