import React, { useState, useEffect } from "react";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import axios from "@/utils/axios";

export default function Event() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initial load of events
  useEffect(() => {
    fetchEvents(); // Fetch events when component mounts
  }, []); // Empty dependency array means this runs once on mount

  // Load pending events from localStorage
  useEffect(() => {
    const savedPendingEvents = localStorage.getItem("pendingSync");
    if (savedPendingEvents) {
      setPendingSync(JSON.parse(savedPendingEvents));
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingEvents(); // This will also call fetchEvents after sync
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncPendingEvents = async () => {
    if (pendingSync.length === 0) return;
    
    setIsLoading(true);
    try {
      // Sync each pending event
      for (const event of pendingSync) {
        try {
          if (event._delete) {
            // Handle deleted events
            await axios.delete(`/events/${event.id}`);
          } else if (event._update || event.id) {
            // Handle updates
            await axios.put(`/events/${event.id}`, event);
          } else {
            // Handle new events
            await axios.post('/events', event);
          }
        } catch (error) {
          console.error(`Failed to sync event ${event.id}:`, error);
          // Keep this event in pending sync
          continue;
        }
      }

      // Get successfully synced events
      const successfulSync = await fetchEvents();
      
      // Clear only successfully synced events from pendingSync
      const remainingPending = pendingSync.filter(pendingEvent => {
        const syncedEvent = successfulSync.find(e => e.id === pendingEvent.id);
        return !syncedEvent;
      });

      setPendingSync(remainingPending);
      localStorage.setItem('pendingSync', JSON.stringify(remainingPending));

    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync some events. They will be retried later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await axios.get('/events');
      setEvents(data);
      localStorage.setItem('events', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      // Fall back to local storage if fetch fails
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        setEvents(parsedEvents);
        return parsedEvents;
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (eventData) => {
    if (isOnline) {
      setIsLoading(true);
      try {
        if (editingEvent) {
          // Update existing event
          await axios.put(`/events/${eventData.id}`, eventData);
        } else {
          // Create new event
          await axios.post('/events', eventData);
        }

        // Refresh events from server
        await fetchEvents();
      } catch (error) {
        console.error('Save failed:', error);
        // Update UI optimistically and add to pending sync
        const updatedEvents = events.filter((e) => e.id !== eventData.id);
        setEvents([...updatedEvents, eventData]);
        localStorage.setItem('events', JSON.stringify([...updatedEvents, eventData]));
        // Add to pending sync with update flag
        addToPendingSync({ ...eventData, _update: true });
        alert('Your event is saved locally and will be synced when possible');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle offline save/update
      if (editingEvent) {
        addToPendingSync({ ...eventData, _update: true });
      } else {
        addToPendingSync(eventData);
      }
    }

    setShowModal(false);
    setEditingEvent(null);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    if (isOnline) {
      setIsLoading(true);
      try {
        await axios.delete(`/events/${eventId}`);
        await fetchEvents();
      } catch (error) {
        const updatedEvents = events.filter((e) => e.id !== eventId);
        setEvents(updatedEvents);
        localStorage.setItem("events", JSON.stringify(updatedEvents));
        // Add to pending sync with a delete flag
        addToPendingSync({ id: eventId, _delete: true });
        console.error("Delete failed:", error);
        alert("Your event is deleted successfully");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle offline delete
      const updatedEvents = events.filter((e) => e.id !== eventId);
      setEvents(updatedEvents);
      localStorage.setItem("events", JSON.stringify(updatedEvents));
      // Add to pending sync with a delete flag
      addToPendingSync({ id: eventId, _delete: true });
    }
  };

  const addToPendingSync = (eventData) => {
    const updatedPendingSync = [...pendingSync];
    
    // Check if we're updating an existing pending event
    const existingPendingIndex = updatedPendingSync.findIndex(
      p => p.id === eventData.id
    );

    if (existingPendingIndex !== -1) {
      // Update existing pending event
      updatedPendingSync[existingPendingIndex] = eventData;
    } else {
      // Add new pending event
      updatedPendingSync.push(eventData);
    }

    setPendingSync(updatedPendingSync);
    localStorage.setItem('pendingSync', JSON.stringify(updatedPendingSync));
    
    // Update local events immediately
    const updatedEvents = editingEvent
      ? events.map(e => e.id === eventData.id ? eventData : e)
      : [...events, eventData];
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  // Update getAllEvents to filter out deleted events
  const getAllEvents = () => {
    const pendingEvents = pendingSync.filter((event) => !event._delete);
    const existingEventIds = new Set(events.map((e) => e.id));

    // Get IDs of events pending deletion
    const pendingDeleteIds = new Set(
      pendingSync.filter((event) => event._delete).map((event) => event.id)
    );

    // Add pending events that don't exist in main events list
    const newPendingEvents = pendingEvents.filter(
      (e) => !existingEventIds.has(e.id)
    );

    // Update existing events with pending changes, excluding deleted ones
    const updatedEvents = events
      .filter((event) => !pendingDeleteIds.has(event.id))
      .map((event) => {
        const pendingUpdate = pendingEvents.find((p) => p.id === event.id);
        return pendingUpdate || event;
      });

    return [...updatedEvents, ...newPendingEvents];
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Events</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          disabled={isLoading}
        >
          Create New Event
        </button>
      </div>

      {!isOnline && (
        <div className="alert alert-warning" role="alert">
          You are currently offline. Changes will be synced when you're back
          online.
        </div>
      )}

      <div className="row">
        {getAllEvents().map((event) => (
          <div key={event.id} className="col-md-6 col-lg-4">
            <EventCard
              event={event}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isPending={pendingSync.some(
                (p) => p.id === event.id || !event.id
              )}
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
