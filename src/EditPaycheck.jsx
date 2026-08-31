import { useState } from 'react'
import { db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { samplePaycheck } from './sampleData'

function EditPaycheck({ user, paycheck, onSave, onBack }) {
  const [amount, setAmount] = useState(paycheck.amount.toString())
  const [allocations, setAllocations] = useState(
    paycheck.buckets.reduce((acc, bucket) => {
      acc[bucket.id] = bucket.categories.reduce((catAcc, category) => {
        catAcc[category.id] = category.allocated || 0
        return catAcc
      }, {})
      return acc
    }, {})
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Recalculate buckets when amount changes
  const getUpdatedBuckets = () => {
    const newAmount = parseFloat(amount)
    return samplePaycheck.buckets.map(bucket => ({
      ...bucket,
      amount: (bucket.percentage / 100) * newAmount,
      categories: bucket.categories.map(category => ({
        ...category,
        allocated: allocations[bucket.id]?.[category.id] || 0,
        spent: paycheck.buckets.find(b => b.id === bucket.id)?.categories.find(c => c.id === category.id)?.spent || 0
      }))
    }))
  }

  const handleAllocationChange = (bucketId, categoryId, value) => {
    setAllocations(prev => ({
      ...prev,
      [bucketId]: {
        ...prev[bucketId],
        [categoryId]: parseFloat(value) || 0
      }
    }))
  }

  const getBucketTotal = (bucketId) => {
    const newAmount = parseFloat(amount)
    const bucket = samplePaycheck.buckets.find(b => b.id === bucketId)
    return bucket ? (bucket.percentage / 100) * newAmount : 0
  }

  const getAllocatedTotal = (bucketId) => {
    return Object.values(allocations[bucketId] || {}).reduce((sum, val) => sum + val, 0)
  }

  const isAllocationValid = () => {
    return samplePaycheck.buckets.every(bucket => {
      const total = getBucketTotal(bucket.id)
      const allocated = getAllocatedTotal(bucket.id)
      return Math.abs(total - allocated) < 0.01
    })
  }

  const handleSave = async () => {
    const newAmount = parseFloat(amount)

    if (!newAmount || newAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!isAllocationValid()) {
      setError('All allocations must add up to bucket totals')
      return
    }

    setLoading(true)
    setError('')

    try {
      const updatedBuckets = getUpdatedBuckets()

      const budgetRef = doc(db, 'users', user.uid, 'budgets', paycheck.id)
      await updateDoc(budgetRef, {
        amount: newAmount,
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
      <h1>Edit Paycheck</h1>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>
        Back
      </button>

      {/* EDIT AMOUNT */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid blue' }}>
        <h2>Paycheck Amount</h2>
        <label>Amount: $</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
        />
      </div>

      {/* EDIT ALLOCATIONS */}
      <h2>Allocate Budget</h2>
      <p>Allocate your ${parseFloat(amount).toFixed(2)} paycheck to each category</p>

      {samplePaycheck.buckets.map((bucket) => (
        <div key={bucket.id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid gray' }}>
          <h3>{bucket.name}</h3>
          <p>Bucket Total: ${getBucketTotal(bucket.id).toFixed(2)}</p>

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
        {loading ? 'Saving...' : 'Save Changes'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

export default EditPaycheck
