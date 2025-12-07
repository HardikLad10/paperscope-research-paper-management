import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { API_BASE_URL } from '../config'
import './PaperModal.css'

function PaperModal({ paper_id: sourcePaperId, onClose, onSelectRecommendation }) {
  const [paperData, setPaperData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addingDraft, setAddingDraft] = useState(null) // Track which recommendation is being added

  // Debug: Log when modal opens
  useEffect(() => {
    if (sourcePaperId) {
      console.log('[PaperModal] Opening modal for paper:', sourcePaperId)
    }
  }, [sourcePaperId])

  // Fetch Paper Metadata
  useEffect(() => {
    async function loadPaper() {
      if (!sourcePaperId) return
      
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/api/papers/${encodeURIComponent(sourcePaperId)}`)
        if (!res.ok) throw new Error('Failed to load paper')
        const json = await res.json()
        setPaperData(json)
      } catch (e) {
        setError("Failed to load paper metadata")
        console.error("Error loading paper:", e)
      } finally {
        setLoading(false)
      }
    }
    loadPaper()
  }, [sourcePaperId])

  // Fetch AI Recommendations
  useEffect(() => {
    async function loadRecs() {
      if (!sourcePaperId) return
      
      setRecommendationsLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/papers/${encodeURIComponent(sourcePaperId)}/recommendations`)
        if (res.ok) {
          const json = await res.json()
          // Backend now returns { paper_id, recommendations: [...] }
          setRecommendations(Array.isArray(json.recommendations) ? json.recommendations : [])
        } else if (res.status === 503) {
          // Service not available
          setRecommendations([])
        } else {
          throw new Error('Failed to load recommendations')
        }
      } catch (e) {
        console.error("Error loading recommendations:", e)
        setRecommendations([])
      } finally {
        setRecommendationsLoading(false)
      }
    }
    loadRecs()
  }, [sourcePaperId])

  // Handler for adding AI draft to My Papers
  const handleAddAIDraft = async (rec) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.user_id) {
      alert('Please log in to add papers to your collection')
      return
    }

    setAddingDraft(rec.title)
    try {
      const newPaperId = "P_" + uuidv4()
      const res = await fetch(`${API_BASE_URL}/api/ai-drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_paper_id: sourcePaperId,
          paper_id: newPaperId,
          title: rec.title,
          abstract: rec.summary || rec.abstract || '',
          user_id: user.user_id
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.message || err.error || 'Failed to create AI draft')
        return
      }

      alert('AI draft created. Check it under My Papers.')
    } catch (e) {
      console.error('Error creating AI draft:', e)
      alert('Error creating AI draft: ' + (e.message || 'Unknown error'))
    } finally {
      setAddingDraft(null)
    }
  }

  // AI recommendations are fictional, so clicking them does nothing
  // (Option A: no action on click)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <button className="modal-close" onClick={onClose}>×</button>
        
        {loading && (
          <div className="modal-loading">
            <p>Loading paper details...</p>
          </div>
        )}

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        {paperData && !loading && (
          <>
            <div className="modal-header">
              <h2>{paperData.paper_title}</h2>
              <div className="modal-paper-id">Paper ID: {sourcePaperId}</div>
            </div>

            <div className="modal-meta">
              {paperData.venue_name && (
                <p><strong>Venue:</strong> {paperData.venue_name} {paperData.year ? `(${paperData.year})` : ''}</p>
              )}
              {paperData.status && (
                <p><strong>Status:</strong> {paperData.status}</p>
              )}
              {paperData.upload_timestamp && (
                <p><strong>Uploaded:</strong> {new Date(paperData.upload_timestamp).toLocaleDateString()}</p>
              )}
            </div>

            <div className="modal-abstract">
              <h3>Abstract</h3>
              <p>{paperData.abstract || 'No abstract available'}</p>
            </div>

            {paperData.pdf_url && (
              <div className="modal-pdf">
                <a
                  href={paperData.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-pdf-link"
                >
                  View PDF
                </a>
              </div>
            )}

            <div className="modal-recommendations">
              <h3>AI Recommended Papers</h3>
              
              {recommendationsLoading && (
                <p className="recommendations-loading">Loading recommendations...</p>
              )}

              {!recommendationsLoading && recommendations.length === 0 && (
                <p className="no-recommendations">No recommendations available</p>
              )}

              {!recommendationsLoading && recommendations.length > 0 && (
                <div className="recommendations-list">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="recommendation-item ai-recommendation"
                      title="AI-generated recommendation (fictional paper)"
                    >
                      <div className="recommendation-header">
                        <strong className="recommendation-title">{rec.title}</strong>
                        <span className="ai-badge">AI Generated</span>
                      </div>
                      {rec.summary && (
                        <p className="recommendation-summary">
                          {rec.summary}
                        </p>
                      )}
                      {rec.reason && (
                        <div className="recommendation-reason">
                          <strong>Why recommended:</strong> {rec.reason}
                        </div>
                      )}
                      <button
                        className="add-ai-draft-button"
                        onClick={() => handleAddAIDraft(rec)}
                        disabled={addingDraft === rec.title}
                      >
                        {addingDraft === rec.title ? 'Adding...' : 'Add to My Papers'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PaperModal

