import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import './PaperModal.css'

function PaperModal({ paper_id, onClose, onSelectRecommendation }) {
  const [paperData, setPaperData] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Debug: Log when modal opens
  useEffect(() => {
    if (paper_id) {
      console.log('[PaperModal] Opening modal for paper:', paper_id)
    }
  }, [paper_id])

  // Fetch Paper Metadata
  useEffect(() => {
    async function loadPaper() {
      if (!paper_id) return
      
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/api/papers/${encodeURIComponent(paper_id)}`)
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
  }, [paper_id])

  // Fetch AI Recommendations
  useEffect(() => {
    async function loadRecs() {
      if (!paper_id) return
      
      setRecommendationsLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/papers/${encodeURIComponent(paper_id)}/recommendations`)
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
  }, [paper_id])

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
              <div className="modal-paper-id">Paper ID: {paper_id}</div>
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

