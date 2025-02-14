import React from 'react';

const EventCard = ({ event, onEdit, onDelete, onToggleCompletion, isPending,setFormData }) => {
  console.log("event",event);
  const isEventPassed = new Date(event.endDate) < new Date();
  
  return (
    <div className={`card mb-4 event-card ${event.completed ? 'bg-success text-black' : isEventPassed ? 'bg-light' : 'bg-white'}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="card-title mb-1">{event.name}</h5>
            {isPending && (
              <span className="badge bg-warning text-dark mb-2">
                Sync
              </span>
            )}
          </div>
          <div>
            <button 
              className={`btn me-2 ${event.completed ? 'btn-info' : 'btn-success'}`} 
              onClick={() => onToggleCompletion(event)}
            >
              {event.completed ? 'Mark as pending' : 'Mark as completed'}
            </button>
            <button 
              className="btn me-2 btn-primary" 
              onClick={() => onEdit(event)}
            >
              Edit
            </button>
            <button 
              className="btn btn-danger" 
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
};

export default EventCard; 