import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import EventModal from './EventModal';

export default function Event() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingEvents();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const syncPendingEvents = async () => {
    if (pendingSync.length > 0) {
      // Here you would implement your API calls to sync the pending events
      // For now, we'll just update the local storage
      const updatedEvents = [...events, ...pendingSync];
      setEvents(updatedEvents);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
      setPendingSync([]);
    }
  };

  const handleSave = (eventData) => {
    const updatedEvents = editingEvent
      ? events.map(e => e.id === editingEvent.id ? eventData : e)
      : [...events, eventData];

    if (isOnline) {
      // Here you would make your API call
      setEvents(updatedEvents);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
    } else {
      setPendingSync([...pendingSync, eventData]);
      localStorage.setItem('pendingSync', JSON.stringify(pendingSync));
    }

    setEditingEvent(null);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDelete = (eventId) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const updatedEvents = events.filter(e => e.id !== eventId);
      setEvents(updatedEvents);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Events</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowModal(true)}
        >
          Create New Event
        </button>
      </div>

      {!isOnline && (
        <div className="alert alert-warning" role="alert">
          You are currently offline. Changes will be synced when you're back online.
        </div>
      )}

      <div className="row">
        {events.map(event => (
          <div key={event.id} className="col-md-6 col-lg-4">
            <EventCard
              event={event}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>

      <EventModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEvent(null);
        }}
        onSave={handleSave}
        event={editingEvent}
      />
    </div>
  );
}
