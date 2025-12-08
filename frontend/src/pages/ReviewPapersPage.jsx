import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './ReviewPapersPage.css'

export default function ReviewPapersPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [venues, setVenues] = useState([])
  const [papers, setPapers] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Filter states
  const [filters, setFilters] = useState({
    venue_id: '',
    search: ''
  })

  // Review form states
  const [newComment, setNewComment] = useState('')
  const [reviews, setReviews] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  // Check authentication and reviewer status
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.is_reviewer !== 1 && user.is_reviewer !== '1') {
      navigate('/')
      return
    }

    setCurrentUser(user)

    // Fetch venues for filter
    fetch(`${API_BASE_URL}/api/venues`)
      .then(res => res.json())
      .then(data => setVenues(data))
      .catch(() => setVenues([]))
  }, [navigate])

  // Load reviewable papers when user is set or pagination changes
  useEffect(() => {
    if (currentUser) {
      loadReviewablePapers()
    }
  }, [currentUser, pagination.page, pagination.limit, filters])

  // Load reviews when a paper is selected
  useEffect(() => {
    if (!selectedPaper) {
      setReviews([])
      return
    }

    fetch(`${API_BASE_URL}/api/papers/${selectedPaper.paper_id}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(() => setReviews([]))
  }, [selectedPaper])

  const loadReviewablePapers = async () => {
    if (!currentUser) return

    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.append('user_id', currentUser.user_id)

      // Only add venue_id if it's not empty
      if (filters.venue_id && filters.venue_id.trim()) {
        params.append('venue_id', filters.venue_id.trim())
      }

      // Only add search query if it's not empty
      if (filters.search && filters.search.trim()) {
        params.append('q', filters.search.trim())
      }

      // Add pagination parameters
      params.append('page', pagination.page)
      params.append('limit', pagination.limit)

      const url = `${API_BASE_URL}/api/reviewable-papers?${params.toString()}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load reviewable papers' }))
        throw new Error(errorData.error || 'Failed to load reviewable papers')
      }

      const data = await response.json()
      setPapers(Array.isArray(data.papers) ? data.papers : [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
      setError('')
    } catch (err) {
      console.error('Error loading reviewable papers:', err)
      setError(err.message || 'Failed to load papers. Please try again.')
      setPapers([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to page 1 when filtering
  }

  const resetFilters = () => {
    setFilters({ venue_id: '', search: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit, total: pagination.total, totalPages: Math.ceil(pagination.total / newLimit) })
  }

  const handleRowClick = (paper) => {
    setSelectedPaper(paper)
    setSubmitError('')
    setSubmitSuccess('')
    setNewComment('')
  }

  const handleSubmitReview = async () => {
    if (!selectedPaper || !currentUser || !newComment.trim()) return

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/papers/${selectedPaper.paper_id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          comment: newComment.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit review')
      } else {
        setSubmitSuccess(`Success! Your review has been submitted for "${selectedPaper.paper_title}".`)
        setNewComment('')

        // Refresh reviews list
        const reviewsRes = await fetch(`${API_BASE_URL}/api/papers/${selectedPaper.paper_id}/reviews`)
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData)

        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setSubmitSuccess(''), 5000)
      }
    } catch (e) {
      setSubmitError('Network error while submitting review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="review-papers-page">
      <h1>Review Papers</h1>
      <p className="page-subtitle">
        Browse and review papers that you did not author. Your reviews help improve research quality.
      </p>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="venue-filter">Venue</label>
          <select
            id="venue-filter"
            value={filters.venue_id}
            onChange={(e) => handleFilterChange('venue_id', e.target.value)}
          >
            <option value="">All venues</option>
            {venues.map(v => (
              <option key={v.venue_id} value={v.venue_id}>
                {v.venue_name} ({v.year})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group filter-search">
          <label htmlFor="search-filter">Search</label>
          <input
            id="search-filter"
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by paper title or abstract..."
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="btn-apply">
            Apply Filters
          </button>
          <button onClick={resetFilters} className="btn-reset">
            Reset
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Pagination Controls - Top */}
      {!loading && papers.length > 0 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} papers
          </div>
          <div className="pagination-buttons">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="page-indicator">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
          <div className="page-size-selector">
            <label>Per page:</label>
            <select value={pagination.limit} onChange={(e) => handleLimitChange(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Papers Table */}
      <div className="papers-table-container">
        {loading ? (
          <div className="loading-state">Loading papers...</div>
        ) : (
          <table className="papers-table">
            <thead>
              <tr>
                <th>Paper Title</th>
                <th>Venue</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {papers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">
                    No reviewable papers found. Adjust your filters or check back later.
                  </td>
                </tr>
              ) : (
                papers.map(paper => (
                  <tr
                    key={paper.paper_id}
                    onClick={() => handleRowClick(paper)}
                    className={selectedPaper?.paper_id === paper.paper_id ? 'selected' : ''}
                  >
                    <td className="title-cell">{paper.paper_title}</td>
                    <td>{paper.venue_name || 'Unknown'}</td>
                    <td>{paper.review_count || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected Paper Details Panel */}
      {selectedPaper && (
        <div className="selected-paper-panel">
          <div className="paper-details">
            <h2>{selectedPaper.paper_title}</h2>
            <div className="paper-info">
              <p><strong>Paper ID:</strong> {selectedPaper.paper_id}</p>
              <p><strong>Venue:</strong> {selectedPaper.venue_name || 'N/A'}</p>
              {selectedPaper.abstract && (
                <p><strong>Abstract:</strong> {selectedPaper.abstract}</p>
              )}
              <div className="pdf-action">
                {selectedPaper.pdf_url ? (
                  <a
                    href={selectedPaper.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-pdf-button"
                  >
                    Open PDF
                  </a>
                ) : (
                  <p className="pdf-unavailable-text">PDF URL not available for this paper.</p>
                )}
              </div>
            </div>
          </div>

          <div className="reviews-section">
            <h3>Write a Review</h3>

            {submitError && (
              <div className="error-banner">{submitError}</div>
            )}

            {submitSuccess && (
              <div className="success-banner">{submitSuccess}</div>
            )}

            {currentUser ? (
              <>
                <div className="reviewer-info-banner">
                  <strong>Reviewing as:</strong> {currentUser.user_name} ({currentUser.user_id} – {currentUser.affiliation || 'No affiliation'})
                </div>

                <div className="review-form">
                  <label htmlFor="comment-textarea">Comment</label>
                  <textarea
                    id="comment-textarea"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your feedback on methodology, experiments, and clarity..."
                    rows={4}
                    disabled={isSubmitting}
                  />

                  <button
                    onClick={handleSubmitReview}
                    disabled={!newComment.trim() || isSubmitting}
                    className="submit-review-btn"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </>
            ) : (
              <div className="login-prompt">
                Please log in to write reviews.
              </div>
            )}

            <hr />

            <h3>Existing Reviews ({reviews.length})</h3>

            {reviews.length === 0 ? (
              <p className="empty-state">No reviews yet. Be the first to review this paper.</p>
            ) : (
              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review.review_id} className="review-card">
                    <div className="review-header">
                      <strong>{review.user_name}</strong> ({review.user_id} – {review.affiliation || 'No affiliation'})
                      <span className="review-timestamp">
                        {new Date(review.review_timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="review-comment">
                      {review.comment}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedPaper && (
        <div className="selected-paper-panel">
          <p className="placeholder-text">Select a paper above to view and write reviews.</p>
        </div>
      )}
    </div>
  )
}

