import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './AuthorInsightsPage.css'

export default function AuthorInsightsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [insights, setInsights] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/login')
      return
    }

    const user = JSON.parse(userStr)
    fetchInsights(user.user_id)
  }, [navigate])

  const fetchInsights = async (userId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/authors/${userId}/insights`)
      if (!response.ok) {
        throw new Error('Failed to load insights')
      }
      const data = await response.json()
      setInsights(data)
    } catch (err) {
      console.error('Error loading insights:', err)
      setError('Failed to load insights. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="insights-page">
        <div className="insights-loading">Loading insights...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="insights-page">
        <div className="insights-error">{error}</div>
      </div>
    )
  }

  const { summary, top_reviewed_papers, yearly_stats, status_breakdown } = insights || {}

  return (
    <div className="insights-page">
      <h1>Author Insights</h1>
      <p className="insights-subtitle">
        Overview of your publication and review activity based on authored papers.
      </p>

      {/* Summary Cards */}
      {summary ? (
        <div className="insights-summary">
          <div className="insights-card">
            <div className="card-label">Total Papers</div>
            <div className="card-value">{summary.total_papers}</div>
          </div>
          <div className="insights-card">
            <div className="card-label">Total Reviews Received</div>
            <div className="card-value">{summary.total_reviews}</div>
          </div>
          <div className="insights-card">
            <div className="card-label">Avg Reviews per Paper</div>
            <div className="card-value">
              {Number(summary.avg_reviews_per_paper).toFixed(2)}
            </div>
          </div>
        </div>
      ) : (
        <div className="insights-empty">
          No authored papers yet. Create a paper to see insights.
        </div>
      )}

      {/* Top Reviewed Papers */}
      <div className="insights-section">
        <h2>Top Reviewed Papers</h2>
        {top_reviewed_papers && top_reviewed_papers.length > 0 ? (
          <div className="top-papers-grid">
            {top_reviewed_papers.map((paper) => (
              <div key={paper.paper_id} className="paper-card">
                <h3 className="paper-title">{paper.paper_title}</h3>
                <div className="paper-meta">
                  <span>Paper ID: {paper.paper_id}</span>
                </div>
                <div className="paper-stats">
                  <div>Total reviews: <strong>{paper.review_count}</strong></div>
                  {paper.last_review_at && (
                    <div>
                      Last review: {new Date(paper.last_review_at).toLocaleString()}
                    </div>
                  )}
                </div>
                {paper.pdf_url ? (
                  <a
                    href={paper.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pdf-link-btn"
                  >
                    Open PDF
                  </a>
                ) : (
                  <span className="no-pdf-text">No PDF link available</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="insights-empty">
            You don't have any reviewed papers yet.
          </div>
        )}
      </div>

      {/* Yearly Activity */}
      <div className="insights-section">
        <h2>Yearly Activity</h2>
        {yearly_stats && yearly_stats.length > 0 ? (
          <table className="insights-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Papers Published</th>
                <th>Reviews Received</th>
              </tr>
            </thead>
            <tbody>
              {yearly_stats.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.papers_published}</td>
                  <td>{row.reviews_received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="insights-empty">No yearly activity available yet.</div>
        )}
      </div>

      {/* Status Breakdown */}
      <div className="insights-section">
        <h2>Status Breakdown</h2>
        {status_breakdown && status_breakdown.length > 0 ? (
          <table className="insights-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Number of Papers</th>
              </tr>
            </thead>
            <tbody>
              {status_breakdown.map((row) => (
                <tr key={row.status}>
                  <td>{row.status}</td>
                  <td>{row.paper_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="insights-empty">No authored papers to summarize yet.</div>
        )}
      </div>
    </div>
  )
}

