import React, { useState, useEffect } from 'react';

export default function EventModal({ show, onClose, onSave, event = null,setFormData,formData }) {
  // const [formData, setFormData] = useState({
  //   name: '',
  //   startDate: '',
  //   endDate: '',
  //   participants: ['']
  // });

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Parse the date string in local timezone
    const d = new Date(dateString);
    
    if (isNaN(d.getTime())) return '';
    
    // Format maintaining local timezone (YYYY-MM-DDThh:mm)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        completed: event.completed,
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        participants: event.participants?.length ? event.participants : ['']
      });
    }
  }, [event]);

  const handleEmailChange = (index, value) => {
    const updatedParticipants = [...formData.participants];
    updatedParticipants[index] = value;
    setFormData({ ...formData, participants: updatedParticipants });
  };

  const addEmailField = () => {
    setFormData({
      ...formData,
      participants: [...formData.participants, '']
    });
  };

  const removeEmailField = (index) => {
    const updatedParticipants = formData.participants.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      participants: updatedParticipants.length ? updatedParticipants : ['']
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const participants = formData.participants
      .map(email => email.trim())
      .filter(email => email);

    onSave({
      ...formData,
      participants,
      id: event?.id || Date.now()
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{event ? 'Edit Event' : 'Create Event'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Start Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">End Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Participants</label>
                {formData.participants.map((email, index) => (
                  <div key={index} className="input-group mb-2">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => removeEmailField(index)}
                      disabled={formData.participants.length === 1}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-2"
                  onClick={addEmailField}
                >
                  + Add Another Email
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
              <button type="submit" className="btn btn-primary">Save Event</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 