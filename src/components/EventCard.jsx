import React from 'react';

export default function EventCard({ event, onEdit, onDelete, isPending }) {
  const isEventPassed = new Date(event.endDate) < new Date();
  
  return (
    <div className={`card mb-3 ${isEventPassed ? 'bg-light' : 'bg-white'}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title mb-1">{event.name}</h5>
            {isPending && (
              <span className="badge bg-warning text-dark mb-2">
                Pending Sync
              </span>
            )}
          </div>
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