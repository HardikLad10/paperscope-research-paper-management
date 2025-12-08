import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import './CreatePaperPage.css'

export default function BatchCreatePapersPage() {
    const navigate = useNavigate()
    const [venues, setVenues] = useState([])
    const [projects, setProjects] = useState([])
    const [datasets, setDatasets] = useState([])
    const [users, setUsers] = useState([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)
    const [expandedIndex, setExpandedIndex] = useState(0) // Only one expanded at a time

    // Get logged-in user
    const userStr = localStorage.getItem('user')
    if (!userStr) {
        navigate('/login')
        return <div>Redirecting to login...</div>
    }
    const currentUser = JSON.parse(userStr)

    // State for multiple papers
    const [papers, setPapers] = useState([
        {
            paper_title: '',
            abstract: '',
            pdf_url: '',
            status: 'Under Review',
            venue_id: '',
            project_id: '',
            dataset_id: '',
            author_ids_raw: ''
        }
    ])

    // Fetch dropdown data
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/venues`)
            .then(res => res.json())
            .then(data => setVenues(data))
            .catch(() => setVenues([]))

        fetch(`${API_BASE_URL}/api/projects`)
            .then(res => res.json())
            .then(data => setProjects(data))
            .catch(() => setProjects([]))

        fetch(`${API_BASE_URL}/api/datasets`)
            .then(res => res.json())
            .then(data => setDatasets(data))
            .catch(() => setDatasets([]))

        fetch(`${API_BASE_URL}/api/users`)
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(() => setUsers([]))
    }, [])

    const addPaper = () => {
        setPapers([...papers, {
            paper_title: '',
            abstract: '',
            pdf_url: '',
            status: 'Under Review',
            venue_id: '',
            project_id: '',
            dataset_id: '',
            author_ids_raw: ''
        }])
        setExpandedIndex(papers.length) // Expand the new paper
    }

    const addMultiple = (count) => {
        const newPapers = Array(count).fill(null).map(() => ({
            paper_title: '',
            abstract: '',
            pdf_url: '',
            status: 'Under Review',
            venue_id: '',
            project_id: '',
            dataset_id: '',
            author_ids: [currentUser.user_id]
        }))
        setPapers([...papers, ...newPapers])
    }

    const removePaper = (index) => {
        setPapers(papers.filter((_, i) => i !== index))
        if (expandedIndex >= papers.length - 1) {
            setExpandedIndex(Math.max(0, papers.length - 2))
        }
    }

    const removeAll = () => {
        setPapers([{
            paper_title: '',
            abstract: '',
            pdf_url: '',
            status: 'Under Review',
            venue_id: '',
            project_id: '',
            dataset_id: '',
            author_ids_raw: ''
        }])
        setExpandedIndex(0)
    }

    const updatePaper = (index, field, value) => {
        const updated = [...papers]
        updated[index][field] = value
        setPapers(updated)
    }

    const updateAuthors = (index, selectedOptions) => {
        const authorIds = Array.from(selectedOptions).map(opt => opt.value)
        updatePaper(index, 'author_ids', authorIds)
    }

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? -1 : index)
    }

    const getVenueName = (venueId) => {
        const venue = venues.find(v => v.venue_id === venueId)
        return venue ? `${venue.venue_name} (${venue.year})` : ''
    }

    const validateBatch = () => {
        for (let i = 0; i < papers.length; i++) {
            const paper = papers[i]
            if (!paper.paper_title.trim()) {
                return `Paper #${i + 1}: Title is required`
            }
            if (!paper.pdf_url.trim()) {
                return `Paper #${i + 1}: PDF URL is required`
            }
            if (!paper.venue_id) {
                return `Paper #${i + 1}: Venue is required`
            }
            if (!paper.author_ids_raw || !paper.author_ids_raw.trim()) {
                return `Paper #${i + 1}: At least one author is required`
            }
        }
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess(null)

        const validationError = validateBatch()
        if (validationError) {
            setError(validationError)
            window.scrollTo(0, 0)
            return
        }

        setLoading(true)

        try {
            // Convert author_ids_raw to author_ids array for each paper
            const papersToSubmit = papers.map(paper => ({
                ...paper,
                author_ids: paper.author_ids_raw
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id.length > 0)
            }))

            const res = await fetch(`${API_BASE_URL}/api/papers/batch-with-authors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ papers: papersToSubmit })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to create papers in batch')
                if (data.duplicates) {
                    setError(`Duplicate titles found: ${data.duplicates}`)
                }
            } else {
                setSuccess({
                    count: data.created_count,
                    summary: data.summary || []
                })
                setPapers([{
                    paper_title: '',
                    abstract: '',
                    pdf_url: '',
                    status: 'Under Review',
                    venue_id: '',
                    project_id: '',
                    dataset_id: '',
                    author_ids_raw: ''
                }])
                setExpandedIndex(0)
            }
            window.scrollTo(0, 0)
        } catch (err) {
            setError('Network error while creating papers')
        }

        setLoading(false)
    }

    return (
        <div className="create-paper-container" style={{ paddingBottom: '100px' }}>
            <h1>Batch Other Authors' Papers</h1>
            <p className="subtitle">
                Add multiple papers by other authors at once. All papers will be created in a single transaction.
            </p>

            {error && <div className="error-banner">{error}</div>}

            {success && (
                <div className="success-banner">
                    <h3>🎉 Batch Created Successfully!</h3>
                    <p>{success.count} papers were created</p>
                    {success.summary.length > 0 && (
                        <ul style={{ marginTop: '10px', textAlign: 'left' }}>
                            {success.summary.map((s, i) => (
                                <li key={i}>{s.venue_name || 'No venue'}: {s.num_created} paper(s)</li>
                            ))}
                        </ul>
                    )}
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => navigate('/my-papers')} className="btn-submit">
                            View My Papers
                        </button>
                        <button onClick={() => setSuccess(null)} className="btn-cancel">
                            Create More
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Top buttons */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={addPaper} className="btn-submit">
                        + Add Paper
                    </button>
                    <button type="button" onClick={removeAll} className="btn-cancel">
                        Remove All
                    </button>
                </div>

                {/* Paper blocks - collapsible */}
                {papers.map((paper, index) => {
                    const isExpanded = expandedIndex === index
                    const titlePreview = paper.paper_title || 'Untitled'
                    const statusBadge = paper.status
                    const venueName = getVenueName(paper.venue_id)

                    return (
                        <div key={index} style={{
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            background: 'white',
                            overflow: 'hidden'
                        }}>
                            {/* Collapsed Header */}
                            <div
                                onClick={() => toggleExpand(index)}
                                style={{
                                    padding: '15px 20px',
                                    background: isExpanded ? '#f9fafb' : 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <strong>Paper #{index + 1}</strong>
                                    {!isExpanded && (
                                        <span style={{ marginLeft: '10px', color: '#6b7280' }}>
                                            {titlePreview.substring(0, 50)}{titlePreview.length > 50 ? '...' : ''}
                                        </span>
                                    )}
                                    {!isExpanded && (
                                        <div style={{ marginTop: '5px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                background: '#dbeafe',
                                                color: '#1e40af',
                                                borderRadius: '12px',
                                                fontSize: '12px'
                                            }}>
                                                {statusBadge}
                                            </span>
                                            {venueName && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    background: '#fef3c7',
                                                    color: '#92400e',
                                                    borderRadius: '12px',
                                                    fontSize: '12px'
                                                }}>
                                                    {venueName}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {papers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removePaper(index); }}
                                            style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                    <span style={{ color: '#9ca3af' }}>
                                        {isExpanded ? '▼' : '▶'}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded Form */}
                            {isExpanded && (
                                <div style={{ padding: '20px' }}>
                                    <div className="form-group">
                                        <label>Paper Title <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            value={paper.paper_title}
                                            onChange={(e) => updatePaper(index, 'paper_title', e.target.value)}
                                            placeholder="Enter paper title"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Abstract</label>
                                        <textarea
                                            value={paper.abstract}
                                            onChange={(e) => updatePaper(index, 'abstract', e.target.value)}
                                            placeholder="Enter abstract"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>PDF URL <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            value={paper.pdf_url}
                                            onChange={(e) => updatePaper(index, 'pdf_url', e.target.value)}
                                            placeholder="https://arxiv.org/pdf/..."
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Status <span className="required">*</span></label>
                                        <select
                                            value={paper.status}
                                            onChange={(e) => updatePaper(index, 'status', e.target.value)}
                                        >
                                            <option value="Draft">Draft</option>
                                            <option value="Under Review">Under Review</option>
                                            <option value="Published">Published</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Venue <span className="required">*</span></label>
                                        <select
                                            value={paper.venue_id}
                                            onChange={(e) => updatePaper(index, 'venue_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Select venue</option>
                                            {venues.map(v => (
                                                <option key={v.venue_id} value={v.venue_id}>
                                                    {v.venue_name} ({v.year})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Project (Optional)</label>
                                        <select
                                            value={paper.project_id}
                                            onChange={(e) => updatePaper(index, 'project_id', e.target.value)}
                                        >
                                            <option value="">Select project</option>
                                            {projects.map(p => (
                                                <option key={p.project_id} value={p.project_id}>
                                                    {p.project_title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Dataset (Optional)</label>
                                        <select
                                            value={paper.dataset_id}
                                            onChange={(e) => updatePaper(index, 'dataset_id', e.target.value)}
                                        >
                                            <option value="">Select dataset</option>
                                            {datasets.map(d => (
                                                <option key={d.dataset_id} value={d.dataset_id}>
                                                    {d.dataset_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Author User IDs (comma-separated) <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            value={paper.author_ids_raw}
                                            onChange={(e) => updatePaper(index, 'author_ids_raw', e.target.value)}
                                            placeholder="Example: U003, U005, U012"
                                            required
                                        />
                                        <small className="help-text">Enter author user IDs separated by commas</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* Sticky footer with submit buttons */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'white',
                    borderTop: '2px solid #e5e7eb',
                    padding: '15px 20px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '15px',
                    zIndex: 1000,
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
                }}>
                    <button type="button" className="btn-cancel" onClick={() => navigate('/my-papers')} style={{ maxWidth: '150px' }}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={loading} style={{ maxWidth: '250px' }}>
                        {loading ? `Creating ${papers.length} paper(s)...` : `Submit Batch (${papers.length} paper${papers.length > 1 ? 's' : ''})`}
                    </button>
                </div>
            </form>
        </div>
    )
}
