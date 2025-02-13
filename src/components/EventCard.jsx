import React from 'react';

export default function EventCard({ event, onEdit, onDelete }) {
  const isEventPassed = new Date(event.endDate) < new Date();
  
  return (
    <div className={`card mb-3 ${isEventPassed ? 'bg-light' : 'bg-white'}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <h5 className="card-title">{event.name}</h5>
          <div>
            <button 
              className="btn btn-sm btn-outline-primary me-2" 
              onClick={() => onEdit(event)}
            >
              Edit
            </button>
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={() => onDelete(event.id)}
            >
              Delete
            </button>
          </div>
        </div>
        <p className="card-text">
          <small className="text-muted">
            Start: {new Date(event.startDate).toLocaleString()}
          </small>
        </p>
        <p className="card-text">
          <small className="text-muted">
            End: {new Date(event.endDate).toLocaleString()}
          </small>
        </p>
        {event.participants && (
          <div className="mt-2">
            <small className="text-muted">
              Participants: {event.participants.join(', ')}
            </small>
          </div>
        )}
      </div>
    </div>
  );
} 