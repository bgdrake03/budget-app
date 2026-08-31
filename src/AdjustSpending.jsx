import { useState } from 'react'
import { db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'

function AdjustSpending({ user, budget, onBack, onSave }) {
  const [adjustments, setAdjustments] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAdjustmentChange = (categoryId, newAmount) => {
    setAdjustments(prev => ({
      ...prev,
      [categoryId]: parseFloat(newAmount) || 0
    }))
  }

  const getAdjustmentAmount = (category) => {
    if (adjustments[category.id] !== undefined) {
      return adjustments[category.id]
    }
    return category.spent
  }

  const getAdjustmentDifference = (category) => {
    const newAmount = getAdjustmentAmount(category)
    return newAmount - category.spent
  }

  const getTotalAdjustment = () => {
    return Object.keys(adjustments).reduce((total, categoryId) => {
      const category = findCategory(categoryId)
      if (category) {
        return total + getAdjustmentDifference(category)
      }
      return total
    }, 0)
  }

  const hasAdjustments = Object.keys(adjustments).length > 0

  const findCategory = (categoryId) => {
    for (const bucket of budget.buckets) {
      const cat = bucket.categories.find(c => c.id === parseInt(categoryId))
      if (cat) return cat
    }
    return null
  }

  const handleSave = async () => {
    if (!hasAdjustments) {
      onBack()
      return
    }

    setLoading(true)
    setError('')

    try {
      const updatedBuckets = budget.buckets.map(bucket => ({
        ...bucket,
        categories: bucket.categories.map(category => {
          if (adjustments[category.id] !== undefined) {
            return {
              id: category.id,
              name: category.name,
              allocated: category.allocated,
              spent: adjustments[category.id],
              type: category.type || 'spending'
            }
          }
          return category
        })
      }))

      const budgetRef = doc(db, 'users', user.uid, 'budgets', budget.id)
      await updateDoc(budgetRef, {
        buckets: updatedBuckets
      })

      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Adjust Spending Totals</h1>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>
        Back
      </button>

      {error && <p style={{ color: '#EC4899', marginBottom: '15px' }}>{error}</p>}

      {budget.buckets.map((bucket) => (
        <div
          key={bucket.id}
          style={{
            marginBottom: '20px',
            padding: '15px',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h2>{bucket.name}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bucket.categories.map((category) => {
              const currentAmount = getAdjustmentAmount(category)
              const difference = getAdjustmentDifference(category)
              const isAdjusted = adjustments[category.id] !== undefined

              return (
                <div
                  key={category.id}
                  style={{
                    backgroundColor: isAdjusted ? '#fff9e6' : '#f9fafb',
                    borderRadius: '8px',
                    padding: '12px',
                    border: isAdjusted ? '1px solid #F59E0B' : '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {category.name}
                    </p>
                    {isAdjusted && (
                      <p style={{ margin: 0, fontSize: '12px', color: difference > 0 ? '#10B981' : '#EF4444', fontWeight: 500 }}>
                        {difference > 0 ? '+' : ''} ${difference.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Current: ${category.spent.toFixed(2)}
                      </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Adjust to: $</label>
                      <input
                        type="number"
                        value={currentAmount}
                        onChange={(e) => handleAdjustmentChange(category.id, e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        style={{ width: '100px', padding: '6px 8px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {hasAdjustments && (
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #0284c7'
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: '#0c4a6e', fontWeight: 500 }}>
            Total adjustment: {getTotalAdjustment() > 0 ? '+' : ''} ${getTotalAdjustment().toFixed(2)}
          </p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          backgroundColor: hasAdjustments ? '#10B981' : '#9CA3AF',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '4px',
          border: 'none',
          cursor: hasAdjustments ? 'pointer' : 'not-allowed',
          marginRight: '10px'
        }}
      >
        {loading ? 'Saving...' : 'Save Adjustments'}
      </button>
    </div>
  )
}

export default AdjustSpending
