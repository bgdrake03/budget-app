import { useState } from 'react'
import { db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'

function AllocateBudget({ user, paycheck, onAllocationComplete }) {
  const [allocations, setAllocations] = useState(
    paycheck.buckets.reduce((acc, bucket) => {
      acc[bucket.id] = bucket.categories.reduce((catAcc, category) => {
        catAcc[category.id] = 0
        return catAcc
      }, {})
      return acc
    }, {})
  )
  const [bucketAmounts, setBucketAmounts] = useState(
    paycheck.buckets.reduce((acc, bucket) => {
      acc[bucket.id] = bucket.amount
      return acc
    }, {})
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAllocationChange = (bucketId, categoryId, value) => {
    setAllocations(prev => ({
      ...prev,
      [bucketId]: {
        ...prev[bucketId],
        [categoryId]: parseFloat(value) || 0
      }
    }))
  }

  const handleBucketAmountChange = (bucketId, value) => {
    setBucketAmounts(prev => ({
      ...prev,
      [bucketId]: parseFloat(value) || 0
    }))
  }

  const getBucketTotal = (bucketId) => {
    return bucketAmounts[bucketId] || 0
  }

  const getAllocatedTotal = (bucketId) => {
    return Object.values(allocations[bucketId] || {}).reduce((sum, val) => sum + val, 0)
  }

  const isAllocationValid = () => {
    return paycheck.buckets.every(bucket => {
      const total = getBucketTotal(bucket.id)
      const allocated = getAllocatedTotal(bucket.id)
      return Math.abs(total - allocated) < 0.01 // Allow for floating point errors
    })
  }

  const handleSave = async () => {
    if (!isAllocationValid()) {
      setError('All allocations must add up to bucket totals')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update budget with allocations and bucket amounts
      const updatedBuckets = paycheck.buckets.map(bucket => ({
        ...bucket,
        amount: bucketAmounts[bucket.id],
        categories: bucket.categories.map(category => {
          const type = category.type || 'spending'
          const updated = {
            id: category.id,
            name: category.name,
            allocated: allocations[bucket.id][category.id] || 0,
            spent: category.spent || 0,
            type
          }
          if (type === 'savings' && typeof category.goal === 'number') {
            updated.goal = category.goal
          }
          return updated
        })
      }))

      const budgetRef = doc(db, 'users', user.uid, 'budgets', paycheck.id)
      await updateDoc(budgetRef, {
        buckets: updatedBuckets,
        status: 'active'
      })

      onAllocationComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Allocate Budget</h1>
      <p>Allocate your ${paycheck.amount.toFixed(2)} paycheck to each category</p>

      {paycheck.buckets.map((bucket) => (
        <div key={bucket.id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid gray' }}>
          <h2>{bucket.name}</h2>
          <div style={{ marginBottom: '15px' }}>
            <label>Bucket Total: $</label>
            <input
              type="number"
              value={bucketAmounts[bucket.id] || ''}
              onChange={(e) => handleBucketAmountChange(bucket.id, e.target.value)}
              placeholder="0.00"
              step="0.01"
              style={{ width: '120px', marginLeft: '5px' }}
            />
            <p style={{ fontSize: '12px', color: 'gray', marginTop: '5px' }}>
              (Originally: ${bucket.amount.toFixed(2)})
            </p>
          </div>

          <div style={{ marginLeft: '20px' }}>
            {bucket.categories.map((category) => (
              <div key={category.id} style={{ marginBottom: '10px' }}>
                <label>{category.name}: $</label>
                <input
                  type="number"
                  value={allocations[bucket.id]?.[category.id] || ''}
                  onChange={(e) => handleAllocationChange(bucket.id, category.id, e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  style={{ width: '100px' }}
                />
              </div>
            ))}
          </div>

          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
            Allocated: ${getAllocatedTotal(bucket.id).toFixed(2)} / ${getBucketTotal(bucket.id).toFixed(2)}
            {Math.abs(getAllocatedTotal(bucket.id) - getBucketTotal(bucket.id)) < 0.01 ? '✓' : '✗'}
          </p>
        </div>
      ))}

      <button onClick={handleSave} disabled={loading || !isAllocationValid()}>
        {loading ? 'Saving...' : 'Complete Allocation'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default AllocateBudget