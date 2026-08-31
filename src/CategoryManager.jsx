import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { samplePaycheck } from './sampleData'

function CategoryManager({ user, onBack }) {
  const [categories, setCategories] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editType, setEditType] = useState('spending')
  const [editGoal, setEditGoal] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'categories')
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        setCategories(settingsDoc.data().buckets)
      } else {
        // If no custom categories, use sample data
        setCategories(samplePaycheck.buckets.map(bucket => ({
          id: bucket.id,
          name: bucket.name,
          percentage: bucket.percentage,
          categories: bucket.categories.map(cat => ({
            id: cat.id,
            name: cat.name
          }))
        })))
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleAddCategory = async (bucketId, categoryName) => {
    if (!categoryName.trim()) {
      alert('Please enter a category name')
      return
    }

    const updatedCategories = categories.map(bucket => {
      if (bucket.id === bucketId) {
        const newId = Math.max(...bucket.categories.map(c => c.id), 0) + 1
        const newCategory = { id: newId, name: categoryName, type: 'spending' }
        return {
          ...bucket,
          categories: [
            ...bucket.categories,
            newCategory
          ]
        }
      }
      return bucket
    })

    setCategories(updatedCategories)
    setNewCategoryName({ ...newCategoryName, [bucketId]: '' })
    await saveCategories(updatedCategories)
  }

  const handleEditType = async (bucketId, categoryId, newType) => {
    const updatedCategories = categories.map(bucket => {
      if (bucket.id === bucketId) {
        return {
          ...bucket,
          categories: bucket.categories.map(cat => {
            if (cat.id === categoryId) {
              const updated = { ...cat, type: newType }
              if (newType === 'savings' && !updated.goal) {
                updated.goal = 0
              }
              return updated
            }
            return cat
          })
        }
      }
      return bucket
    })

    setCategories(updatedCategories)
    await saveCategories(updatedCategories)
  }

  const handleEditGoal = async (bucketId, categoryId, newGoal) => {
    const updatedCategories = categories.map(bucket => {
      if (bucket.id === bucketId) {
        return {
          ...bucket,
          categories: bucket.categories.map(cat => {
            if (cat.id === categoryId) {
              return { ...cat, goal: parseFloat(newGoal) || 0 }
            }
            return cat
          })
        }
      }
      return bucket
    })

    setCategories(updatedCategories)
    await saveCategories(updatedCategories)
  }

  const handleDeleteCategory = async (bucketId, categoryId) => {
    if (!window.confirm('Delete this category?')) return

    const updatedCategories = categories.map(bucket => {
      if (bucket.id === bucketId) {
        return {
          ...bucket,
          categories: bucket.categories.filter(c => c.id !== categoryId)
        }
      }
      return bucket
    })

    setCategories(updatedCategories)
    await saveCategories(updatedCategories)
  }

  const saveCategories = async (updatedCategories) => {
    setSaving(true)
    try {
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'categories')
      await setDoc(settingsRef, { buckets: updatedCategories })
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  if (loading) return <p>Loading categories...</p>

  return (
    <div style={{ padding: '20px' }}>
      <h1>Manage Categories</h1>
      <button onClick={onBack} style={{ marginBottom: '20px' }}>
        Back
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {saving && <p style={{ color: 'blue' }}>Saving...</p>}

      {categories && categories.map((bucket) => (
        <div key={bucket.id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid gray' }}>
          <h2>{bucket.name}</h2>
          <p style={{ fontSize: '12px', color: 'gray' }}>({bucket.percentage}%)</p>

          <div style={{ marginBottom: '15px' }}>
            <h4>Categories:</h4>
            {bucket.categories.length === 0 ? (
              <p style={{ color: 'gray', fontStyle: 'italic' }}>No categories yet</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {bucket.categories.map((category) => (
                  <li
                    key={category.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <p style={{ margin: 0, fontWeight: 500, marginBottom: '4px' }}>{category.name}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={category.type || 'spending'}
                          onChange={(e) => handleEditType(bucket.id, category.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          <option value="spending">Spending</option>
                          <option value="savings">Savings</option>
                        </select>
                        {category.type === 'savings' && (
                          <input
                            type="number"
                            placeholder="Goal"
                            value={category.goal || ''}
                            onChange={(e) => handleEditGoal(bucket.id, category.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '12px', width: '80px' }}
                          />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(bucket.id, category.id)}
                      style={{
                        backgroundColor: '#EC4899',
                        color: 'white',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        border: 'none'
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="New category name"
              value={newCategoryName[bucket.id] || ''}
              onChange={(e) => setNewCategoryName({ ...newCategoryName, [bucket.id]: e.target.value })}
            />
            <button
              onClick={() => handleAddCategory(bucket.id, newCategoryName[bucket.id] || '')}
              style={{ backgroundColor: '#4CAF50', color: 'white', padding: '5px 15px', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CategoryManager
