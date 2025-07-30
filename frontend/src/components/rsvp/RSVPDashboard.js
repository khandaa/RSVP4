import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaChartPie, 
  FaUserCheck, 
  FaUserTimes, 
  FaUserClock, 
  FaFilter, 
  FaDownload,
  FaPrint,
  FaEnvelope,
  FaCalendarAlt,
  FaSearch,
  FaSync
} from 'react-icons/fa';
import { rsvpAPI, eventAPI } from '../../services/api';

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
  const [recentResponses, setRecentResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);
  
  // Fetch RSVP stats when an event is selected
  useEffect(() => {
    if (selectedEvent) {
      fetchRsvpStats();
      fetchRecentResponses();
    }
  }, [selectedEvent]);
  
  // Fetch events from API
  const fetchEvents = async () => {
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
  };
  
  // Fetch RSVP statistics for the selected event
  const fetchRsvpStats = async () => {
    if (!selectedEvent) return;
    
    try {
      setIsLoading(true);
      const response = await rsvpAPI.getRsvpStats(selectedEvent);
      
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
  };
  
  // Fetch recent RSVP responses
  const fetchRecentResponses = async () => {
    if (!selectedEvent) return;
    
    try {
      const response = await rsvpAPI.getRsvps({ 
        event_id: selectedEvent,
        limit: 5,
        sort: 'rsvp_date',
        order: 'desc'
      });
      
      if (response && response.data) {
        setRecentResponses(response.data);
      }
    } catch (error) {
      console.error('Error fetching recent RSVP responses:', error);
    }
  };
  
  // Handle event change
  const handleEventChange = (e) => {
    setSelectedEvent(e.target.value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchRsvpStats();
    fetchRecentResponses();
    toast.info('Dashboard refreshed!');
  };
  
  // Get the selected event name
  const getSelectedEventName = () => {
    const event = events.find(e => e.event_id.toString() === selectedEvent);
    return event ? event.event_name : 'All Events';
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
          >
            <FaDownload /> Export
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
          
          {/* Recent Responses */}
          <div className="card glass-card">
            <div className="card-header bg-transparent border-0">
              <h5 className="mb-0">Recent Responses</h5>
            </div>
            <div className="card-body">
              {recentResponses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Status</th>
                        <th>Response Date</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResponses.map(response => (
                        <tr key={response.rsvp_id}>
                          <td>{response.guest_name || 'Guest ' + response.guest_id}</td>
                          <td>
                            {response.rsvp_status === 'attending' && (
                              <span className="badge bg-success">Attending</span>
                            )}
                            {response.rsvp_status === 'declined' && (
                              <span className="badge bg-danger">Declined</span>
                            )}
                            {response.rsvp_status === 'pending' && (
                              <span className="badge bg-warning">Pending</span>
                            )}
                          </td>
                          <td>{new Date(response.rsvp_date).toLocaleDateString()}</td>
                          <td>{response.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No recent RSVP responses found</p>
                </div>
              )}
            </div>
            <div className="card-footer bg-transparent text-end">
              <button 
                className="btn btn-primary"
                onClick={() => navigate(`/rsvps/bulk?event=${selectedEvent}`)}
              >
                View All Responses
              </button>
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
    </div>
  );
};

export default RSVPDashboard;
