import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import './EditPaperModal.css'

function EditPaperModal({ paper, onClose, onSave }) {
    const [formData, setFormData] = useState({
        paper_title: '',
        abstract: '',
        pdf_url: '',
        status: '',
        venue_id: ''
    })
    const [venues, setVenues] = useState([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [saving, setSaving] = useState(false)

    // Load paper data and venues
    useEffect(() => {
        if (paper) {
            setFormData({
                paper_title: paper.paper_title || '',
                abstract: paper.abstract || '',
                pdf_url: paper.pdf_url || '',
                status: paper.status || 'AI_DRAFT',
                venue_id: paper.venue_id || ''
            })
        }

        // Load venues for dropdown
        fetch(`${API_BASE_URL}/api/venues`)
            .then(res => res.json())
            .then(data => setVenues(data))
            .catch(() => setVenues([]))
    }, [paper])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setError('')
        setSuccess('')
        setSaving(true)

        try {
            const res = await fetch(`${API_BASE_URL}/api/papers/${paper.paper_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                // Trigger error messages will be in data.message
                setError(data.message || 'Update failed')
                setSaving(false)
                return
            }

            // Success - show message and close after delay
            setSuccess('Paper updated successfully!')
            setSaving(false)

            setTimeout(() => {
                if (onSave) onSave()
                onClose()
            }, 1500)
        } catch (e) {
            console.error('Error updating paper:', e)
            setError('Update failed: ' + (e.message || 'Unknown error'))
            setSaving(false)
        }
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!paper) return null

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-container edit-paper-modal">
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <h2>Edit Paper</h2>
                    {paper.ai_generated === 1 && paper.status === 'AI_DRAFT' && (
                        <div className="edit-info-banner">
                            <strong>AI Draft:</strong> To promote to "Under Review", you must add a real PDF URL and ensure the abstract is at least 50 characters.
                        </div>
                    )}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                <div className="edit-form">
                    <div className="form-group">
                        <label htmlFor="paper_title">Title *</label>
                        <input
                            id="paper_title"
                            type="text"
                            value={formData.paper_title}
                            onChange={(e) => handleChange('paper_title', e.target.value)}
                            placeholder="Paper title"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="abstract">Abstract</label>
                        <textarea
                            id="abstract"
                            value={formData.abstract}
                            onChange={(e) => handleChange('abstract', e.target.value)}
                            placeholder="Paper abstract (minimum 50 characters for Under Review)"
                            rows={6}
                        />
                        <div className="char-count">
                            {formData.abstract.length} characters
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="pdf_url">PDF URL</label>
                        <input
                            id="pdf_url"
                            type="text"
                            value={formData.pdf_url}
                            onChange={(e) => handleChange('pdf_url', e.target.value)}
                            placeholder="https://example.com/paper.pdf"
                        />
                        {formData.pdf_url === 'AI_DRAFT_NO_PDF' && (
                            <div className="field-warning">
                                This is a placeholder. Add a real PDF URL to promote to Under Review.
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="venue_id">Venue</label>
                        <select
                            id="venue_id"
                            value={formData.venue_id}
                            onChange={(e) => handleChange('venue_id', e.target.value)}
                        >
                            <option value="">Select venue</option>
                            {venues.map(v => (
                                <option key={v.venue_id} value={v.venue_id}>
                                    {v.venue_name} {v.year ? `(${v.year})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="AI_DRAFT">AI Draft</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Draft">Draft</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Published">Published</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button onClick={onClose} className="btn-cancel" disabled={saving}>
                            Cancel
                        </button>
                        <button onClick={handleSave} className="btn-save" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditPaperModal
