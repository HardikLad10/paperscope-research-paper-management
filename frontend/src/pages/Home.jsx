import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import PaperModal from '../components/PaperModal'
import EditPaperModal from '../components/EditPaperModal'
import './Home.css'

function Home({ defaultTab = 'search' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [venues, setVenues] = useState([])
  const [selectedPaperId, setSelectedPaperId] = useState(null)
  const [editingPaper, setEditingPaper] = useState(null)

  // Filter states for search
  const [filters, setFilters] = useState({
    q: '',
    venue_id: '',
    status: ''
  })

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Load venues for filter dropdown
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/venues`)
      .then(res => res.json())
      .then(data => setVenues(data))
      .catch(() => setVenues([]))
  }, [])

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  // Load papers based on active tab
  useEffect(() => {
    if (activeTab === 'all') {
      loadAllPapers()
    } else if (activeTab === 'my-papers') {
      loadMyPapers()
    } else if (activeTab === 'search') {
      // Load all papers by default when search tab is active
      loadSearchPapers(1)
    }
  }, [activeTab])

  const loadAllPapers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/papers?page=1&limit=50`)
      if (!response.ok) throw new Error('Failed to load papers')
      const data = await response.json()
      setPapers(data.papers || data)
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSearchPapers = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.q && filters.q.trim()) params.append('q', filters.q.trim())
      if (filters.venue_id && filters.venue_id.trim()) params.append('venue_id', filters.venue_id.trim())
      if (filters.status && filters.status.trim()) params.append('status', filters.status.trim())
      params.append('page', page.toString())
      params.append('limit', '50')

      const url = `${API_BASE_URL}/api/papers?${params.toString()}`
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Search failed' }))
        throw new Error(errorData.error || 'Search failed')
      }
      const data = await response.json()
      setPapers(data.papers || data)
      if (data.pagination) {
        setPagination(data.pagination)
      } else {
        // Fallback for old response format
        setPagination({
          page: 1,
          limit: 50,
          total: (data.papers || data).length,
          totalPages: 1
        })
      }
    } catch (err) {
      console.error('Error loading papers:', err)
      setError(err.message || 'Failed to load papers')
      setPapers([])
    } finally {
      setLoading(false)
    }
  }

  const searchPapers = async () => {
    // Reset to page 1 when applying filters
    loadSearchPapers(1)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const resetFilters = () => {
    setFilters({ q: '', venue_id: '', status: '' })
    setTimeout(() => loadSearchPapers(1), 100)
  }

  const handlePageChange = (newPage) => {
    loadSearchPapers(newPage)
  }

  const handleDeletePaper = async (paperId) => {
    const raw = localStorage.getItem('user')
    const currentUser = raw ? JSON.parse(raw) : null
    const userId = currentUser?.user_id

    if (!userId) {
      alert('You must be logged in to delete a paper.')
      return
    }

    const ok = window.confirm('Are you sure you want to delete this paper? This cannot be undone.')
    if (!ok) return

    // Find paper title for success message
    const paperToDelete = papers.find(p => p.paper_id === paperId)
    const paperTitle = paperToDelete?.paper_title || 'Paper'

    try {
      const res = await fetch(`${API_BASE_URL}/api/papers/${paperId}?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete paper')
      }

      // Remove from local state
      setPapers((prev) => prev.filter((p) => p.paper_id !== paperId))
      setError('')
      setSuccessMessage(`Paper "${paperTitle}" has been successfully deleted.`)

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
    } catch (err) {
      console.error(err)
      setError('Failed to delete paper: ' + (err.message || 'Unknown error'))
      setSuccessMessage('')
    }
  }

  const loadMyPapers = async () => {
    if (!user?.user_id) {
      setError('Please log in to view your papers')
      return
    }

    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        since: '2018-01-01'
      })
      const response = await fetch(`${API_BASE_URL}/api/authors/${encodeURIComponent(user.user_id)}/portfolio?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to load your papers: ${response.status}`)
      }
      const data = await response.json()
      setPapers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading my papers:', err)
      setError(err.message || 'Failed to load your papers. Please try again later.')
      setPapers([])
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="content-panel">
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {activeTab === 'search' && (
        <div className="search-section">
          <div className="filter-bar">
            <div className="filter-group filter-search">
              <label htmlFor="search-input">Search</label>
              <input
                id="search-input"
                type="text"
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
                placeholder="Search by paper title or abstract..."
                onKeyPress={(e) => e.key === 'Enter' && searchPapers()}
              />
            </div>

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
                    {v.venue_name} {v.year ? `(${v.year})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="Under Review">Under Review</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div className="filter-actions">
              <button onClick={searchPapers} className="btn-apply">
                Search / Apply Filters
              </button>
              <button onClick={resetFilters} className="btn-reset">
                Reset
              </button>
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <PapersList papers={papers} onPaperClick={setSelectedPaperId} />
              {pagination.totalPages > 1 && (
                <PaginationControls
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={pagination.limit}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="all-papers-section">
          <button onClick={loadAllPapers} className="refresh-button">
            Refresh Papers
          </button>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <PapersList papers={papers} onPaperClick={setSelectedPaperId} />
          )}
        </div>
      )}

      {activeTab === 'my-papers' && (
        <div className="my-papers-section">
          <button onClick={loadMyPapers} className="refresh-button">
            Refresh My Papers
          </button>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <MyPapersList
              papers={papers}
              onDeletePaper={handleDeletePaper}
              onPaperClick={setSelectedPaperId}
              onEditPaper={(paper) => setEditingPaper(paper)}
            />
          )}
        </div>
      )}

      {/* Paper Modal */}
      {selectedPaperId && (
        <PaperModal
          paper_id={selectedPaperId}
          onClose={() => {
            setSelectedPaperId(null)
            // Refresh My Papers if we're on that tab
            if (activeTab === 'my-papers') {
              loadMyPapers()
            }
          }}
          onSelectRecommendation={(paperId) => setSelectedPaperId(paperId)}
        />
      )}

      {/* Edit Paper Modal */}
      {editingPaper && (
        <EditPaperModal
          paper={editingPaper}
          onClose={() => setEditingPaper(null)}
          onSave={() => {
            setEditingPaper(null)
            loadMyPapers()
          }}
        />
      )}
    </div>
  )
}

function PapersList({ papers, onPaperClick }) {
  if (papers.length === 0) {
    return <div className="empty-state">No papers found</div>
  }

  return (
    <div className="search-papers-grid">
      {papers.map((paper) => (
        <div
          key={paper.paper_id}
          className="paper-card"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onPaperClick) {
              console.log('[PapersList] Clicked paper:', paper.paper_id)
              onPaperClick(paper.paper_id)
            }
          }}
        >
          <div className="paper-card-header">
            <h3 className="paper-title">{paper.paper_title}</h3>
          </div>

          <div className="paper-card-badges">
            {paper.venue_name && (
              <span className="badge badge-venue">
                {paper.venue_name} {paper.year || ''}
              </span>
            )}
            <span className={`badge badge-status ${paper.status === 'Published' ? 'published' : ''}`}>
              {paper.status || 'Unknown'}
            </span>
            {paper.review_count !== undefined && (
              <span className="badge badge-reviews">
                {paper.review_count} {paper.review_count === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>

          <div className="paper-card-abstract">
            {paper.abstract
              ? (paper.abstract.length > 120 ? paper.abstract.substring(0, 120) + '...' : paper.abstract)
              : 'No abstract available'}
          </div>

          <div className="paper-card-footer">
            <span className="paper-date">
              {new Date(paper.upload_timestamp).toLocaleDateString()}
            </span>
            {paper.pdf_url && (
              <button
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(paper.pdf_url, '_blank')
                }}
              >
                View PDF
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function MyPapersList({ papers, onDeletePaper, onPaperClick, onEditPaper }) {
  const [statusFilter, setStatusFilter] = useState('ALL')

  if (papers.length === 0) {
    return <div className="empty-state">No papers found. You haven't authored any papers yet.</div>
  }

  // Filter papers based on status
  const filteredPapers = papers.filter((p) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'AI_DRAFT') return p.status === 'AI_DRAFT'
    if (statusFilter === 'UNDER_REVIEW') return p.status === 'Under Review'
    return true
  })

  return (
    <>
      <div className="my-papers-filter">
        <button
          className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusFilter('ALL')}
        >
          All ({papers.length})
        </button>
        <button
          className={`filter-btn ${statusFilter === 'AI_DRAFT' ? 'active' : ''}`}
          onClick={() => setStatusFilter('AI_DRAFT')}
        >
          AI Drafts ({papers.filter(p => p.status === 'AI_DRAFT').length})
        </button>
        <button
          className={`filter-btn ${statusFilter === 'UNDER_REVIEW' ? 'active' : ''}`}
          onClick={() => setStatusFilter('UNDER_REVIEW')}
        >
          Under Review ({papers.filter(p => p.status === 'Under Review').length})
        </button>
      </div>

      {filteredPapers.length === 0 && (
        <div className="empty-state">No papers match the selected filter.</div>
      )}

      <div className="my-papers-grid">
        {filteredPapers.map((paper) => (
          <div key={paper.paper_id} className="paper-card" onClick={() => onPaperClick && onPaperClick(paper.paper_id)}>
            <div className="paper-card-header">
              <h3 className="paper-title">{paper.paper_title}</h3>
            </div>

            <div className="paper-card-badges">
              {paper.project_title && (
                <span className="badge badge-project">{paper.project_title}</span>
              )}
              <span className="badge badge-type">{paper.status || 'Authored Paper'}</span>
              {paper.review_count !== undefined && (
                <span className="badge badge-reviews">
                  {paper.review_count} {paper.review_count === 1 ? 'review' : 'reviews'}
                </span>
              )}
              {paper.status === 'AI_DRAFT' && (
                <span className="badge badge-ai">AI Draft</span>
              )}
            </div>

            <div className="paper-card-meta">
              <span>
                {paper.coauthor_count > 0
                  ? `${paper.coauthor_count} co-author${paper.coauthor_count === 1 ? '' : 's'}`
                  : 'Solo author'}
              </span>
              <span>
                {paper.upload_timestamp
                  ? new Date(paper.upload_timestamp).toLocaleDateString()
                  : 'Unknown date'}
              </span>
            </div>

            {paper.coauthors && paper.coauthors !== 'No co-authors' && (
              <div className="paper-card-coauthors">
                <strong>Co-authors:</strong> {paper.coauthors}
              </div>
            )}

            <div className="paper-card-actions">
              {paper.pdf_url && paper.pdf_url !== 'AI_DRAFT_NO_PDF' && (
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(paper.pdf_url, '_blank');
                  }}
                >
                  View PDF
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEditPaper) onEditPaper(paper);
                }}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePaper(paper.paper_id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function QueryResults({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">No results found</div>
  }

  return (
    <div className="query-results">
      <table className="results-table">
        <thead>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {Object.values(row).map((value, i) => (
                <td key={i}>{value !== null && value !== undefined ? String(value) : 'N/A'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PaginationControls({ currentPage, totalPages, total, limit, onPageChange }) {
  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, total)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i)
        }
      }
    }
    return pages
  }

  return (
    <div className="pagination-controls">
      <div className="pagination-info">
        Showing {startItem}-{endItem} of {total} papers
      </div>
      <div className="pagination-buttons">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          First
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last
        </button>
      </div>
    </div>
  )
}

export default Home


