import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './Home.css'

function PaperDetail() {
  const { paper_id } = useParams()
  const navigate = useNavigate()
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE_URL}/api/papers/${encodeURIComponent(paper_id)}`)
        if (!res.ok) throw new Error('Failed to load paper')
        const data = await res.json()
        setPaper(data)
      } catch (err) {
        setError(err.message || 'Error loading paper')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [paper_id])

  useEffect(() => {
    // Load recommendations after paper is loaded
    if (paper && !loading) {
      const loadRecommendations = async () => {
        setRecommendationsLoading(true)
        try {
          const res = await fetch(`${API_BASE_URL}/api/papers/${encodeURIComponent(paper_id)}/recommendations`)
          if (res.ok) {
            const data = await res.json()
            setRecommendations(data)
          } else if (res.status === 503) {
            // Service not available (API key not set)
            console.log('Recommendation service not available')
            setRecommendations([])
          }
        } catch (err) {
          console.error('Failed to load recommendations:', err)
          setRecommendations([])
        } finally {
          setRecommendationsLoading(false)
        }
      }
      loadRecommendations()
    }
  }, [paper, paper_id, loading])

  if (loading) {
    return (
      <div className="paper-detail-container">
        <div className="content-panel">
          <div className="loading">Loading paper...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="paper-detail-container">
        <div className="content-panel">
          <div className="error-message">{error}</div>
          <div className="paper-detail-actions">
            <button onClick={() => navigate(-1)} className="back-button">Go back</button>
          </div>
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="paper-detail-container">
        <div className="content-panel">
          <div className="empty-state">Paper not found</div>
          <div className="paper-detail-actions">
            <Link to="/" className="back-button">Back to list</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="paper-detail-container">
      <div className="paper-detail-header">
        <h1>{paper.paper_title}</h1>
        <div className="paper-detail-meta">
          {paper.venue_name && <span className="badge badge-venue">{paper.venue_name} {paper.year || ''}</span>}
          <span className={`badge badge-status ${paper.status === 'Published' ? 'published' : ''}`}>{paper.status || 'Unknown'}</span>
          {paper.upload_timestamp && <div className="paper-date">Uploaded: {new Date(paper.upload_timestamp).toLocaleString()}</div>}
        </div>
      </div>

      <div className="paper-detail-body">
        <h3>Abstract</h3>
        <p>{paper.abstract || 'No abstract available'}</p>

        {paper.pdf_url && (
          <p>
            <a href={paper.pdf_url} target="_blank" rel="noreferrer" className="pdf-link">Open PDF</a>
          </p>
        )}

        <div className="paper-reviews">
          <h3>Review info</h3>
          <p>Review count: {paper.review_count ?? 0}</p>
          {paper.last_review_at && <p>Last review: {new Date(paper.last_review_at).toLocaleString()}</p>}
        </div>
      </div>

      {/* Recommended Papers Section */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <div className="recommendations-header">
            <h2>Similar Papers</h2>
            <p className="recommendations-subtitle">AI-powered recommendations based on this paper</p>
          </div>
          {recommendationsLoading ? (
            <div className="loading">Loading recommendations...</div>
          ) : (
            <div className="recommendations-grid">
              {recommendations.map((rec) => (
                <Link
                  key={rec.paper_id}
                  to={`/papers/${encodeURIComponent(rec.paper_id)}`}
                  className="recommendation-card-link"
                >
                  <div className="recommendation-card">
                    <h4 className="recommendation-title">{rec.paper_title}</h4>
                    <div className="recommendation-meta">
                      {rec.venue_name && (
                        <span className="badge badge-venue">
                          {rec.venue_name} {rec.year || ''}
                        </span>
                      )}
                      <span className={`badge badge-status ${rec.status === 'Published' ? 'published' : ''}`}>
                        {rec.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="recommendation-abstract">
                      {rec.abstract 
                        ? (rec.abstract.length > 120 ? rec.abstract.substring(0, 120) + '...' : rec.abstract)
                        : 'No abstract available'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="paper-detail-actions">
        <Link to="/" className="back-button">Back to list</Link>
      </div>
    </div>
  )
}

export default PaperDetail
