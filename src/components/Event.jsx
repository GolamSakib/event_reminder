import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import axios from "@/utils/axios";
import { Upload } from 'lucide-react';
import Cookies from 'js-cookie';

export default function Event({ setLoggedIn }) {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [pendingSync, setPendingSync] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    completed: false,
    startDate: '',
    endDate: '',
    participants: ['']
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event) => {
    debugger;
    const file = event.target.files[0];
    if (!file) return;

    // Get file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();

    // Check for valid file types
    const validExtensions = ['csv', 'xlsx', 'xls'];
    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      event.target.value = '';
      return;
    }

    const csvData = new FormData();
    debugger;
    csvData.append('file', file);

    setIsUploading(true);
    try {
      const response = await axios.post('/events/import', csvData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${Cookies.get('auth_token')}`
        },
        withCredentials: true
      });

      alert('File imported successfully!');
      fetchEvents(); // Refresh the events list
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import file. Please check your file format.');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };
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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
            let response = await axios.delete(`/events/${event.id}`, {
              withCredentials: true,
              headers: {
                'Authorization': `Bearer ${Cookies.get('auth_token')}`
              }
            });
            let data = pendingSync?.filter((pendingEvent) => pendingEvent.id !== event.id);
            setPendingSync(data);
            localStorage.setItem('pendingSync', JSON.stringify(data));
            await fetchEvents();
          } else if (event._update || event.id) {
            // Handle updates
            let response = await axios.put(`/events/${event.id}`, event, {
              withCredentials: true,
              headers: {
                'Authorization': `Bearer ${Cookies.get('auth_token')}`
              }
            });
            let data = pendingSync?.filter((pendingEvent) => pendingEvent.id !== event.id);
            setPendingSync(data);
            localStorage.setItem('pendingSync', JSON.stringify(data));
            await fetchEvents();
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

      // const successfulSync = await fetchEvents();

      // // Clear only successfully synced events from pendingSync
      // const remainingPending = pendingSync.filter(pendingEvent => {
      //   const syncedEvent = successfulSync.find(e => e.event_reminder_id_from_browser === pendingEvent.id);
      //   return !syncedEvent;
      // });

      // setPendingSync(remainingPending);
      // localStorage.setItem('pendingSync', JSON.stringify(remainingPending));

    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync some events. They will be retried later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      syncPendingEvents();
    }, 7000); // 10000 milliseconds = 10 seconds

    // Cleanup function to clear the timeout
    return () => clearTimeout(timeoutId);
  }, [pendingSync]); // Dependency array can include pendingSync if you want to sync based on changes

  const fetchEvents = async () => {
    try {

      setIsLoading(true);
      const response = await axios.get('/events', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${Cookies.get('auth_token')}`
        }
      });
      console.log("response", response);

      if (response.status === 200) {
        setEvents(response.data); // Assuming response.data is the array of events
        localStorage.setItem('events', JSON.stringify(response.data));
      }

      return response.data; // Return the data from the response
    } catch (error) {
      console.error('Failed to fetch events:', error);
      // Fall back to local storage if fetch fails
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        setEvents(parsedEvents);
        return parsedEvents;
      }
      return []; // Return an empty array if no events are found
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (eventData) => {
    if (isOnline) {
      setIsLoading(true);
      try {
        let response; // Declare response variable outside the try block
        if (editingEvent) {
          // Update existing event
          response = await axios.put(`/events/${eventData.id}`, eventData, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${Cookies.get('auth_token')}`
            }
          });
        } else {
          // Create new event
          response = await axios.post('/events', eventData, {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${Cookies.get('auth_token')}`
            }
          });
        }

        console.log("response_while_save_edit", response); // Log the response

        // Check if the response status is in the 2xx range
        if (response.status >= 200 && response.status < 300) {
          await fetchEvents(); // Refresh events from server
        } else {
          throw new Error('Unexpected response status: ' + response.status);
        }
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
        await axios.delete(`/events/${eventId}`, {
          'withCredentials': true,
          'headers': {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`
          }
        });
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
    let updatedEvents;
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

    if (eventData._delete) {
      updatedEvents = events.filter(e => e.id !== eventData.id);
    }
    if (eventData._update) {
      // updatedEvents=events.map(e => e.id == eventData.id ? eventData : e);
      updatedEvents = events.filter(e => e.id !== eventData.id);

    }

    // const updatedEvents = editingEvent
    //   ? events.map(e => e.id === eventData.id ? eventData : e)
    //   : [...events, eventData];
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

  const handleLogout = async () => {
    try {
      const response = await axios.post('/logout', {}, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${Cookies.get('auth_token')}`
        }
      });

      console.log("response", response);

      if (response.status === 200) {
        // Remove the auth cookie+
        Cookies.remove('auth_token');

        // Redirect to login page
        setLoggedIn(false);
        router.push('/');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  const onToggleCompletion = async (event) => {
    const updatedEvent = { ...event, completed: !event.completed }; // Toggle completion status
    setFormData((prev) => ({ ...prev, completed: !prev.completed }));
    if (isOnline) {
      // If online, update the server
      try {
        const response = await axios.put(`/events/${event.id}`, updatedEvent, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`
          }
        });

        if (response.status >= 200 && response.status < 300) {
          // Call fetchEvents to refresh the events from the server
          await fetchEvents(); // Refresh events from server
        } else {
          throw new Error('Unexpected response status: ' + response.status);
        }
      } catch (error) {
        console.error('Failed to update event:', error);
        // If the update fails, add to pending sync
        updatedEvent._update = true; // Mark as an update
        addToPendingSync(updatedEvent);

      }
    } else {
      // If offline, add to pending sync
      updatedEvent._update = true; // Mark as an update
      addToPendingSync(updatedEvent);
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
        <div className="container">
          <span className="navbar-brand">Event Dashboard</span>
          <button
            className="btn btn-danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

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
          <div className="position-relative d-inline-block">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"  // Updated to accept Excel files
              onChange={handleFileChange}
              className="position-absolute top-0 start-0 opacity-0 w-100 h-100"
              style={{ cursor: 'pointer', zIndex: 2 }}
              disabled={isUploading}
            />
            <button
              className="btn btn-primary d-flex align-items-center gap-2"
              disabled={isUploading}
            >
              <Upload size={18} />
              {isUploading ? 'Importing...' : 'Import CSV'}
            </button>
          </div>
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
                setFormData={setFormData}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleCompletion={onToggleCompletion}
                isPending={pendingSync.some(
                  (p) => p.id === event.id || !event.id
                )}
              />
            </div>
          ))}
        </div>

        <EventModal
          setFormData={setFormData}
          formData={formData}
          show={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSave}
          event={editingEvent}
        />
      </div>
    </div>
  );
}
