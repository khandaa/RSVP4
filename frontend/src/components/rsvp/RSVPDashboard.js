import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaChartPie, 
  FaUserCheck, 
  FaUserTimes, 
  FaUserClock, 
  FaDownload,
  FaEnvelope,
  FaCalendarAlt,
  FaSync
} from 'react-icons/fa';
import { rsvpAPI, eventAPI, guestAPI } from '../../services/api';

const RSVPDashboard = () => {
  const navigate = useNavigate();
  
  // State variables
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [rsvpStats, setRsvpStats] = useState({
    attending: 0,
    declined: 0,
    pending: 0,
    total: 0
  });
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGuests, setSelectedGuests] = useState([]);
  
  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await eventAPI.getEvents();
      if (response && response.data) {
        setEvents(response.data);
        
        // If there are events, select the first one by default
        if (response.data.length > 0) {
          setSelectedEvent(response.data[0].event_id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events. Please try again.');
      setError('Failed to load events. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  // Fetch RSVP statistics for the selected event
  const fetchRsvpStats = useCallback(async () => {
    if (!selectedEvent) return;
    
    try {
      setIsLoading(true);
      const response = await rsvpAPI.getRsvpStatsByEvent({ event_id: selectedEvent });
      
      if (response && response.data) {
        setRsvpStats({
          attending: response.data.attending || 0,
          declined: response.data.declined || 0,
          pending: response.data.pending || 0,
          total: response.data.total || 0
        });
      }
    } catch (error) {
      console.error('Error fetching RSVP statistics:', error);
      toast.error('Failed to load RSVP statistics.');
      setError('Failed to load RSVP statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);
  
  // Fetch recent RSVP responses
  const fetchGuests = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      const response = await guestAPI.getGuests({ event_id: selectedEvent });
      if (response && response.data) {
        setGuests(response.data);
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast.error('Failed to load guests for the event.');
    }
  }, [selectedEvent]);


  // Fetch RSVP stats when an event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchRsvpStats();
      fetchGuests();
    }
  }, [selectedEvent, fetchRsvpStats, fetchGuests]); 
  
  // Handle event change
  const handleEventChange = (e) => {
    setSelectedEvent(e.target.value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchRsvpStats();
    fetchGuests();
    toast.info('Dashboard refreshed!');
  };

  const handleGuestSelection = (guestId) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId) 
        : [...prev, guestId]
    );
  };

  const handleSelectAllGuests = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map(g => g.guest_id));
    }
  };

  const sendInvites = async () => {
    if (selectedGuests.length === 0) {
      toast.warn('Please select at least one guest to send an invite.');
      return;
    }
    try {
      await rsvpAPI.sendRsvpReminders(selectedGuests);
      toast.success(`Invites sent to ${selectedGuests.length} guests.`);
      setSelectedGuests([]);
    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Failed to send invites.');
    }
  };
  
  
  // Calculate response rate percentage
  const calculateResponseRate = () => {
    if (rsvpStats.total === 0) return 0;
    return Math.round(((rsvpStats.attending + rsvpStats.declined) / rsvpStats.total) * 100);
  };
  
  // Navigate to view guests with specific status
  const viewGuestsByStatus = (status) => {
    navigate(`/rsvps/bulk?event=${selectedEvent}&status=${status}`);
  };
  
  // Export RSVP data
  const exportRsvpData = async () => {
    try {
      await rsvpAPI.exportRsvpData(selectedEvent);
      toast.success('RSVP data export started. The file will download shortly.');
    } catch (error) {
      console.error('Error exporting RSVP data:', error);
      toast.error('Failed to export RSVP data.');
    }
  };
  
  // Send reminders to pending guests
  const sendReminders = async () => {
    try {
      if (rsvpStats.pending === 0) {
        toast.info('There are no pending guests to send reminders to.');
        return;
      }
      
      const confirmed = window.confirm(
        `Are you sure you want to send reminders to ${rsvpStats.pending} guests who haven't responded yet?`
      );
      
      if (confirmed) {
        // In a real implementation, this would gather all pending guest IDs first
        await rsvpAPI.sendRsvpReminders([/* pending guest IDs */]);
        toast.success('Reminders sent successfully!');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Failed to send reminders.');
    }
  };
  
  if (isLoading && events.length === 0) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container-fluid p-4">
      {/* Dashboard Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">RSVP Dashboard</h2>
          <p className="text-muted">Monitor guest responses and RSVP statistics</p>
        </div>
        
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary"
            onClick={handleRefresh}
            title="Refresh data"
          >
            <FaSync />
          </button>
          <button 
            className="btn btn-outline-primary"
            onClick={exportRsvpData}
            title="Export RSVP data"
            data-testid="export-rsvp-button"
          >
            <FaDownload /> Export
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/rsvps/form')}
            title="Manage RSVP"
            data-testid="manage-rsvp-button"
          >
            <FaUserCheck className="me-2" /> Manage RSVPs
          </button>
        </div>
      </div>
      
      {/* Event Selection */}
      <div className="card glass-card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <label htmlFor="eventSelect" className="form-label d-flex align-items-center">
                <FaCalendarAlt className="me-2" /> Select Event
              </label>
              <select 
                id="eventSelect"
                className="form-select"
                value={selectedEvent}
                onChange={handleEventChange}
              >
                <option value="">-- Select an event --</option>
                {events.map(event => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 text-end">
              {selectedEvent && (
                <div className="mt-3 mt-md-0">
                  <button 
                    className="btn btn-primary"
                    onClick={sendReminders}
                    disabled={rsvpStats.pending === 0}
                  >
                    <FaEnvelope className="me-2" /> 
                    Send Reminders ({rsvpStats.pending})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : selectedEvent ? (
        <>
          {/* RSVP Statistics */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card glass-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded bg-success-subtle me-3">
                      <FaUserCheck className="text-success" size={24} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Attending</h6>
                      <h2 className="mt-2 mb-0">{rsvpStats.attending}</h2>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button 
                      className="btn btn-sm btn-outline-success w-100"
                      onClick={() => viewGuestsByStatus('attending')}
                    >
                      View Guests
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card glass-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded bg-danger-subtle me-3">
                      <FaUserTimes className="text-danger" size={24} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Declined</h6>
                      <h2 className="mt-2 mb-0">{rsvpStats.declined}</h2>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button 
                      className="btn btn-sm btn-outline-danger w-100"
                      onClick={() => viewGuestsByStatus('declined')}
                    >
                      View Guests
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card glass-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded bg-warning-subtle me-3">
                      <FaUserClock className="text-warning" size={24} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Pending</h6>
                      <h2 className="mt-2 mb-0">{rsvpStats.pending}</h2>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button 
                      className="btn btn-sm btn-outline-warning w-100"
                      onClick={() => viewGuestsByStatus('pending')}
                    >
                      View Guests
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-6 mb-4">
              <div className="card glass-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="p-3 rounded bg-primary-subtle me-3">
                      <FaChartPie className="text-primary" size={24} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Response Rate</h6>
                      <h2 className="mt-2 mb-0">{calculateResponseRate()}%</h2>
                    </div>
                  </div>
                  <div className="progress mt-3" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${calculateResponseRate()}%` }}
                      aria-valuenow={calculateResponseRate()}
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </>
      ) : (
        <div className="text-center my-5">
          <div className="mb-4">
            <FaCalendarAlt size={48} className="text-muted" />
          </div>
          <h4>Please select an event to view RSVP statistics</h4>
          <p className="text-muted">
            Select an event from the dropdown above to view RSVP statistics and manage guest responses.
          </p>
        </div>
      )}

      {selectedEvent && (
        <div className="card glass-card mt-4">
          <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Guests</h5>
            <button 
              className="btn btn-primary" 
              onClick={sendInvites} 
              disabled={selectedGuests.length === 0}
            >
              Send Invite ({selectedGuests.length})
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAllGuests}
                        checked={selectedGuests.length === guests.length && guests.length > 0}
                      />
                    </th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>RSVP Status</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map(guest => (
                    <tr key={guest.guest_id}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedGuests.includes(guest.guest_id)}
                          onChange={() => handleGuestSelection(guest.guest_id)}
                        />
                      </td>
                      <td>{guest.guest_first_name} {guest.guest_last_name}</td>
                      <td>{guest.guest_email}</td>
                      <td>
                        <span className={`badge ${
                          guest.guest_rsvp_status === 'Confirmed' ? 'bg-success' : 
                          guest.guest_rsvp_status === 'Declined' ? 'bg-danger' : 'bg-warning'
                        }`}>
                          {guest.guest_rsvp_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSVPDashboard;
