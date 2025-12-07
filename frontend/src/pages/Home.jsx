import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './Home.css'

function Home({ onLogout }) {
  const [activeTab, setActiveTab] = useState('my-papers-in-review')
  const [searchTerm, setSearchTerm] = useState('')
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // My Papers in Review states
  const [myPapersInReview, setMyPapersInReview] = useState([])
  
  // Assigned Reviews states
  const [assignedReviews, setAssignedReviews] = useState([])
  
  // Advanced Query 1 states
  const [query1Year, setQuery1Year] = useState('2024')
  const [query1UserId, setQuery1UserId] = useState('U005')
  const [query1Results, setQuery1Results] = useState([])
  
  // Advanced Query 2 states
  const [query2Year, setQuery2Year] = useState('2020')
  const [query2Results, setQuery2Results] = useState([])
  
  // Advanced Query 3 states
  const [query3StartDate, setQuery3StartDate] = useState('2024-02-15')
  const [query3EndDate, setQuery3EndDate] = useState('2024-05-15')
  const [query3Results, setQuery3Results] = useState([])
  
  // Advanced Query 4 states
  const [query4UserId, setQuery4UserId] = useState('U010')
  const [query4Results, setQuery4Results] = useState([])

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Load data when tabs change
  useEffect(() => {
    if (activeTab === 'all') {
      loadAllPapers()
    } else if (activeTab === 'my-papers-in-review') {
      loadMyPapersInReview()
    } else if (activeTab === 'assigned-reviews') {
      loadAssignedReviews()
    }
  }, [activeTab])

  const loadMyPapersInReview = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.user_id || user.username}/papers-in-review`)
      if (!response.ok) throw new Error('Failed to load papers in review')
      const data = await response.json()
      setMyPapersInReview(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.user_id || user.username}/assigned-reviews`)
      if (!response.ok) throw new Error('Failed to load assigned reviews')
      const data = await response.json()
      setAssignedReviews(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAllPapers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/papers`)
      if (!response.ok) throw new Error('Failed to lad papers')
      const data = await response.json()
      setPapers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const searchPapers = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/papers?search=${encodeURIComponent(searchTerm)}`
      )
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setPapers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runQuery1 = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/advanced/query1?year=${query1Year}&user_id=${query1UserId}`
      )
      if (!response.ok) throw new Error('Query failed')
      const data = await response.json()
      setQuery1Results(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runQuery2 = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/advanced/query2?year=${query2Year}`
      )
      if (!response.ok) throw new Error('Query failed')
      const data = await response.json()
      setQuery2Results(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runQuery3 = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/advanced/query3?start_date=${query3StartDate}&end_date=${query3EndDate}`
      )
      if (!response.ok) throw new Error('Query failed')
      const data = await response.json()
      setQuery3Results(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runQuery4 = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/advanced/query4?user_id=${query4UserId}`
      )
      if (!response.ok) throw new Error('Query failed')
      const data = await response.json()
      setQuery4Results(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <h1>Papers Management System</h1>
          <div className="header-actions">
            <span className="user-info">Welcome, {user.user_name || user.username || 'User'}</span>
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="home-content">
        <nav className="tabs">
          <button
            className={activeTab === 'my-papers-in-review' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('my-papers-in-review')}
          >
            My Papers in Review
          </button>
          <button
            className={activeTab === 'assigned-reviews' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('assigned-reviews')}
          >
            Assigned Reviews
          </button>
          <button
            className={activeTab === 'search' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('search')}
          >
            Search Papers
          </button>
          <button
            className={activeTab === 'all' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('all')}
          >
            All Papers
          </button>
          <button
            className={activeTab === 'query1' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('query1')}
          >
            Query 1: User Papers
          </button>
          <button
            className={activeTab === 'query2' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('query2')}
          >
            Query 2: Venues by Year
          </button>
          <button
            className={activeTab === 'query3' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('query3')}
          >
            Query 3: Top Reviewers
          </button>
          <button
            className={activeTab === 'query4' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('query4')}
          >
            Query 4: User Paper Reviews
          </button>
        </nav>

        <div className="content-panel">
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'my-papers-in-review' && (
            <div className="my-papers-section">
              <div className="section-header">
                <h2>My Papers in Review</h2>
                <button onClick={loadMyPapersInReview} className="refresh-button">
                  Refresh
                </button>
              </div>
              <p className="section-description">
                Papers you have authored that are currently under review
              </p>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <PapersList papers={myPapersInReview} showReviewCount={true} />
              )}
            </div>
          )}

          {activeTab === 'assigned-reviews' && (
            <div className="assigned-reviews-section">
              <div className="section-header">
                <h2>Assigned Reviews</h2>
                <button onClick={loadAssignedReviews} className="refresh-button">
                  Refresh
                </button>
              </div>
              <p className="section-description">
                Papers assigned to you for review
              </p>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <PapersList papers={assignedReviews} showReviewCount={true} showReviewedStatus={true} />
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="search-section">
              <div className="search-box">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search papers by title or abstract..."
                  onKeyPress={(e) => e.key === 'Enter' && searchPapers()}
                />
                <button onClick={searchPapers} className="search-button">
                  Search
                </button>
              </div>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <PapersList papers={papers} />
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
                <PapersList papers={papers} />
              )}
            </div>
          )}

          {activeTab === 'query1' && (
            <div className="query-section">
              <div className="query-controls">
                <div className="control-group">
                  <label>Year:</label>
                  <input
                    type="number"
                    value={query1Year}
                    onChange={(e) => setQuery1Year(e.target.value)}
                    placeholder="2024"
                  />
                </div>
                <div className="control-group">
                  <label>User ID:</label>
                  <input
                    type="text"
                    value={query1UserId}
                    onChange={(e) => setQuery1UserId(e.target.value)}
                    placeholder="U005"
                  />
                </div>
                <button onClick={runQuery1} className="query-button">
                  Run Query
                </button>
              </div>
              <p className="query-description">
                Get papers authored by a user, filtered by year, sorted by upload timestamp and review count (limit 15)
              </p>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <QueryResults data={query1Results} />
              )}
            </div>
          )}

          {activeTab === 'query2' && (
            <div className="query-section">
              <div className="query-controls">
                <div className="control-group">
                  <label>Year:</label>
                  <input
                    type="number"
                    value={query2Year}
                    onChange={(e) => setQuery2Year(e.target.value)}
                    placeholder="2020"
                  />
                </div>
                <button onClick={runQuery2} className="query-button">
                  Run Query
                </button>
              </div>
              <p className="query-description">
                Get venues with published papers, filtered by year, sorted by year and total papers (limit 15)
              </p>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <QueryResults data={query2Results} />
              )}
            </div>
          )}

          {activeTab === 'query3' && (
            <div className="query-section">
              <div className="query-controls">
                <div className="control-group">
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={query3StartDate}
                    onChange={(e) => setQuery3StartDate(e.target.value)}
                  />
                </div>
                <div className="control-group">
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={query3EndDate}
                    onChange={(e) => setQuery3EndDate(e.target.value)}
                  />
                </div>
                <button onClick={runQuery3} className="query-button">
                  Run Query
                </button>
              </div>
              <p className="query-description">
                Get top reviewers (users who are reviewers) with review counts in date range, sorted by total reviews (limit 15)
              </p>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <QueryResults data={query3Results} />
              )}
            </div>
          )}

          {activeTab === 'query4' && (
            <div className="query-section">
              <div className="query-controls">
                <div className="control-group">
                  <label>User ID:</label>
                  <input
                    type="text"
                    value={query4UserId}
                    onChange={(e) => setQuery4UserId(e.target.value)}
                    placeholder="U010"
                  />
                </div>
                <button onClick={runQuery4} className="query-button">
                  Run Query
                </button>
              </div>
              <p className="query-description">
                Get papers authored by a user with review counts, sorted by review count and last review date (limit 15)
              </p>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <QueryResults data={query4Results} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PapersList({ papers, showReviewCount = false, showReviewedStatus = false }) {
  if (papers.length === 0) {
    return <div className="empty-state">No papers found</div>
  }

  return (
    <div className="papers-grid">
      {papers.map((paper) => (
        <Link
          key={paper.paper_id}
          to={`/papers/${encodeURIComponent(paper.paper_id)}`}
          className="paper-card-link"
          aria-label={`Open paper ${paper.paper_title}`}
        >
          <div className="paper-card">
            <h3 className="paper-title">{paper.paper_title}</h3>
            <div className="paper-meta">
              {paper.venue_name && (
                <span className="badge badge-venue">
                  {paper.venue_name} {paper.year || ''}
                </span>
              )}
              <span className={`badge badge-status ${paper.status === 'Published' ? 'published' : ''}`}>
                {paper.status || 'Unknown'}
              </span>
              {showReviewCount && paper.review_count !== undefined && (
                <span className="badge badge-review">
                  {paper.review_count} {paper.review_count === 1 ? 'Review' : 'Reviews'}
                </span>
              )}
              {showReviewedStatus && paper.has_reviewed && (
                <span className="badge badge-reviewed">
                  Reviewed
                </span>
              )}
            </div>
            <p className="paper-abstract">
              {paper.abstract ? (paper.abstract.length > 150 ? paper.abstract.substring(0, 150) + '...' : paper.abstract) : 'No abstract available'}
            </p>
            <div className="paper-footer">
              <div className="paper-date">
                {paper.upload_timestamp ? new Date(paper.upload_timestamp).toLocaleDateString() : 'No date'}
              </div>
              {paper.last_review_at && (
                <div className="paper-last-review">
                  Last review: {new Date(paper.last_review_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
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

export default Home

