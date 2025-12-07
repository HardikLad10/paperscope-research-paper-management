import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import './Home.css'

function Home({ defaultTab = 'search' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [searchTerm, setSearchTerm] = useState('')
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

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
    }
  }, [activeTab])

  const loadAllPapers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/papers`)
      if (!response.ok) throw new Error('Failed to load papers')
      const data = await response.json()
      setPapers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMyPapers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/authors/${user.user_id}/portfolio`)
      if (!response.ok) throw new Error('Failed to load your papers')
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


  return (
    <div className="content-panel">
          {error && <div className="error-message">{error}</div>}

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

          {activeTab === 'my-papers' && (
            <div className="my-papers-section">
              <button onClick={loadMyPapers} className="refresh-button">
                Refresh My Papers
              </button>
              {loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <PapersList papers={papers} />
              )}
            </div>
          )}
    </div>
  )
}

function PapersList({ papers }) {
  if (papers.length === 0) {
    return <div className="empty-state">No papers found</div>
  }

  return (
    <div className="papers-grid">
      {papers.map((paper) => (
        <div key={paper.paper_id} className="paper-card">
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
          </div>
          <p className="paper-abstract">
            {paper.abstract ? (paper.abstract.length > 150 ? paper.abstract.substring(0, 150) + '...' : paper.abstract) : 'No abstract available'}
          </p>
          <div className="paper-date">
            {new Date(paper.upload_timestamp).toLocaleDateString()}
          </div>
        </div>
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

