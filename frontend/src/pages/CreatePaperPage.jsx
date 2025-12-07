import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './CreatePaperPage.css'

export default function CreatePaperPage() {
  const navigate = useNavigate()
  const [venues, setVenues] = useState([])
  const [projects, setProjects] = useState([])
  const [datasets, setDatasets] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Get logged-in user from localStorage
  const userStr = localStorage.getItem('user')
  
  // If no user, redirect to login
  if (!userStr) {
    navigate('/login')
    return <div>Redirecting to login...</div>
  }
  
  const currentUser = JSON.parse(userStr)

  const [form, setForm] = useState({
    paper_title: '',
    abstract: '',
    pdf_url: '',
    status: 'Under Review',
    venue_id: '',
    project_id: '',
    dataset_id: '',
    coAuthorIdsRaw: '',
  })

  // Fetch dropdown data on mount
  useEffect(() => {
    // Fetch all venues (no year filter)
    fetch(`${API_BASE_URL}/api/venues`)
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch(() => setVenues([]))

    // Fetch projects
    fetch(`${API_BASE_URL}/api/projects`)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => setProjects([]))

    // Fetch datasets
    fetch(`${API_BASE_URL}/api/datasets`)
      .then((res) => res.json())
      .then((data) => setDatasets(data))
      .catch(() => setDatasets([]))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Build author_ids array
    const coAuthors = form.coAuthorIdsRaw
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0 && id !== currentUser.user_id)

    // Remove duplicates
    const uniqueCoAuthors = [...new Set(coAuthors)]

    const body = {
      paper_title: form.paper_title,
      abstract: form.abstract,
      pdf_url: form.pdf_url,
      status: form.status,
      venue_id: form.venue_id,
      project_id: form.project_id || null,
      dataset_id: form.dataset_id || null,
      author_ids: [currentUser.user_id, ...uniqueCoAuthors],
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/papers/with-authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create paper')
      } else {
        const paperTitle = form.paper_title
        setSuccess(`Success! Your paper "${paperTitle}" has been submitted and is now ${form.status}.`)
        // Clear the form
        setForm({
          paper_title: '',
          abstract: '',
          pdf_url: '',
          status: 'Under Review',
          venue_id: '',
          project_id: '',
          dataset_id: '',
          coAuthorIdsRaw: '',
        })
        // Scroll to top to show success message
        window.scrollTo(0, 0)
        // Auto-dismiss success message after 4 seconds
        setTimeout(() => {
          setSuccess('')
        }, 4000)
      }
    } catch (err) {
      setError('Network error while creating paper')
    }

    setLoading(false)
  }

  const handleCancel = () => {
    navigate('/my-papers')
  }

  return (
    <div className="create-paper-container">
        <h1>Create New Paper</h1>
        <p className="subtitle">
          Enter paper details and add co-authors. You will be automatically added as the primary author.
        </p>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <form className="create-paper-form" onSubmit={handleSubmit}>
          {/* Paper Title */}
          <div className="form-group">
            <label htmlFor="paper_title">
              Paper Title <span className="required">*</span>
            </label>
            <input
              id="paper_title"
              type="text"
              name="paper_title"
              value={form.paper_title}
              onChange={handleChange}
              placeholder="Example: Learned Indexes for Range Queries"
              required
            />
          </div>

          {/* Abstract */}
          <div className="form-group">
            <label htmlFor="abstract">Abstract</label>
            <textarea
              id="abstract"
              name="abstract"
              value={form.abstract}
              onChange={handleChange}
              placeholder="Summarize your main contribution, methods, and key results in 2–3 sentences."
              rows="4"
            />
          </div>

          {/* PDF URL */}
          <div className="form-group">
            <label htmlFor="pdf_url">
              PDF URL <span className="required">*</span>
            </label>
            <input
              id="pdf_url"
              type="text"
              name="pdf_url"
              value={form.pdf_url}
              onChange={handleChange}
              placeholder="Example: https://arxiv.org/pdf/2401.12345.pdf"
              required
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="status">
              Status <span className="required">*</span>
            </label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="Draft">Draft</option>
              <option value="Under Review">Under Review</option>
              <option value="Published">Published</option>
            </select>
          </div>

          {/* Venue */}
          <div className="form-group">
            <label htmlFor="venue_id">
              Venue <span className="required">*</span>
            </label>
            <select
              id="venue_id"
              name="venue_id"
              value={form.venue_id}
              onChange={handleChange}
              required
            >
              <option value="">Select venue (e.g., SIGMOD, VLDB, ICDE)</option>
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.venue_name} ({v.year})
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div className="form-group">
            <label htmlFor="project_id">Project (Optional)</label>
            <select id="project_id" name="project_id" value={form.project_id} onChange={handleChange}>
              <option value="">Optional: Link to a research project</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_title}
                </option>
              ))}
            </select>
          </div>

          {/* Dataset */}
          <div className="form-group">
            <label htmlFor="dataset_id">Dataset (Optional)</label>
            <select id="dataset_id" name="dataset_id" value={form.dataset_id} onChange={handleChange}>
              <option value="">Optional: Select dataset used in this paper</option>
              {datasets.map((d) => (
                <option key={d.dataset_id} value={d.dataset_id}>
                  {d.dataset_name}
                </option>
              ))}
            </select>
          </div>

          {/* Co-authors */}
          <div className="form-group">
            <label htmlFor="coAuthorIdsRaw">Co-author User IDs (comma-separated)</label>
            <input
              id="coAuthorIdsRaw"
              type="text"
              name="coAuthorIdsRaw"
              placeholder="Example: U003, U005 (enter co-author user IDs, comma separated)"
              value={form.coAuthorIdsRaw}
              onChange={handleChange}
            />
            <small className="help-text">
              Enter user IDs separated by commas. You ({currentUser.user_id}) will be added automatically.
            </small>
          </div>

          {/* Submit buttons */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Create Paper'}
            </button>
          </div>
        </form>
    </div>
  )
}

