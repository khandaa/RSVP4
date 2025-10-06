import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt, 
  FaUser, 
  FaClock, 
  FaTags,
  FaUsers,
  FaMapMarkerAlt,
  FaClipboardList,
  FaEnvelope,
  FaChartBar,
  FaPlus,
  FaEye
} from 'react-icons/fa';
import { eventAPI } from '../../services/api';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [subevents, setSubevents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      setIsLoading(true);
      
      // Get token from localStorage for authentication
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Fetch event details
      const eventResponse = await eventAPI.getEvent(id);
      setEvent(eventResponse.data);

      // Fetch related data with error handling
      let scheduleResponse = { data: [] };
      let guestsResponse = [];
      
      try {
        scheduleResponse = await eventAPI.getEventSchedule(id);
      } catch (err) {
        console.error('Failed to fetch event schedule:', err);
        // Add toast notification for better user feedback
        toast.warning('Could not load event schedule. Please try again later.');
      }
      
      try {
        // Use authorization header for guests API call
        const guestsRes = await fetch(`/api/guests/event/${id}`, {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });
        
        if (!guestsRes.ok) {
          throw new Error(`Guests fetch failed: ${guestsRes.status}`);
        }
        
        const guestsData = await guestsRes.json();
        guestsResponse = Array.isArray(guestsData) ? guestsData : 
                       (guestsData && Array.isArray(guestsData.data)) ? guestsData.data : [];
      } catch (err) {
        console.error('Failed to fetch guests:', err);
      }

      setSubevents(scheduleResponse.data || []);
      setGuests(guestsResponse || []);

      // Calculate stats
      const stats = {
        totalGuests: guestsResponse?.length || 0,
        confirmedGuests: guestsResponse?.filter(g => {
          const status = g.rsvp?.rsvp_status || g.rsvp_status;
          return status === 'Confirmed' || status === 'Attending';
        }).length || 0,
        pendingRSVPs: guestsResponse?.filter(g => {
          const status = g.rsvp?.rsvp_status || g.rsvp_status;
          return status === 'Pending' || !status;
        }).length || 0,
        totalSubevents: scheduleResponse.data?.length || 0
      };
      setEventStats(stats);

    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Failed to fetch event details');
      navigate('/events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await eventAPI.deleteEvent(id);
      toast.success('Event deleted successfully');
      navigate('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      setShowDeleteModal(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Planned': return 'bg-primary';
      case 'In Progress': return 'bg-warning';
      case 'Completed': return 'bg-success';
      case 'Cancelled': return 'bg-danger';
      case 'Postponed': return 'bg-secondary';
      default: return 'bg-info';
    }
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return 'No date set';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (end && start.toDateString() !== end.toDateString()) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return start.toLocaleDateString();
  };

  const handleRsvpStatusChange = async (guestId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const guest = guests.find(g => g.guest_id === guestId);

      const payload = {
        rsvp_status: newStatus,
      };

      // communication_id is required by the backend ONLY when creating a new RSVP record.
      // If the guest has an associated communication_id, we pass it.
      // If not, we pass a default value that the backend can use for creating the initial record.
      if (guest && guest.communication_id) {
        payload.communication_id = guest.communication_id;
      } else {
        // A default or placeholder is needed if no communication has been sent yet.
        payload.communication_id = 1; 
      }

      const response = await fetch(`/api/guests/${guestId}/rsvp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update RSVP status');
      }

      toast.success('RSVP status updated successfully');

      // Refresh the guest list to show the new status
      fetchEventData();
    } catch (error) {
      console.error('Error updating RSVP status:', error);
      toast.error(error.message || 'Failed to update RSVP status');
    }
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h4 className="text-muted">Event not found</h4>
          <button 
            className="btn btn-primary glass-btn-primary mt-3"
            onClick={() => navigate('/events')}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={() => navigate('/events')}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">{event.event_name}</h2>
              <p className="text-muted mb-0">Event Dashboard</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-info glass-btn"
              onClick={() => navigate(`/events/${id}/calendar`)}
            >
              <FaCalendarAlt className="me-2" />
              Calendar
            </button>
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={() => navigate(`/events/${id}/edit`)}
            >
              <FaEdit className="me-2" />
              Edit
            </button>
            <button 
              className="btn btn-outline-danger glass-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash className="me-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUsers className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{eventStats?.totalGuests || 0}</h4>
                <small className="text-muted">Total Guests</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaEnvelope className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{eventStats?.confirmedGuests || 0}</h4>
                <small className="text-muted">Confirmed RSVPs</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">{eventStats?.pendingRSVPs || 0}</h4>
                <small className="text-muted">Pending RSVPs</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCalendarAlt className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{eventStats?.totalSubevents || 0}</h4>
                <small className="text-muted">Sub Events</small>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="card glass-card mb-4">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <FaChartBar className="me-2" />
                  Overview
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'subevents' ? 'active' : ''}`}
                  onClick={() => setActiveTab('subevents')}
                >
                  <FaClipboardList className="me-2" />
                  Sub Events ({subevents.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'guests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('guests')}
                >
                  <FaUsers className="me-2" />
                  Guests ({guests.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Content */}
        <div className="row g-4">
          {activeTab === 'overview' && (
            <>
              {/* Event Information */}
              <div className="col-lg-8">
                <div className="card glass-card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <FaCalendarAlt className="me-2 text-primary" />
                      Event Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaCalendarAlt className="me-2" />
                            Event Name
                          </label>
                          <p className="fs-5 fw-semibold text-dark">{event.event_name}</p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            Status
                          </label>
                          <div>
                            <span className={`badge glass-badge fs-6 ${getStatusBadgeClass(event.event_status)}`}>
                              {event.event_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaUser className="me-2" />
                            Client
                          </label>
                          <p className="text-dark">
                            <span className="badge bg-info glass-badge">
                              {event.client_name}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaTags className="me-2" />
                            Event Type
                          </label>
                          <p className="text-dark">
                            {event.event_type_name ? (
                              <span className="badge bg-secondary glass-badge">
                                {event.event_type_name}
                              </span>
                            ) : (
                              <span className="text-muted">Not specified</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaClock className="me-2" />
                            Date Range
                          </label>
                          <p className="text-dark">
                            {formatDateRange(event.event_start_date, event.event_end_date)}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            Created Date
                          </label>
                          <p className="text-dark">
                            {new Date(event.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {event.event_description && (
                        <div className="col-12">
                          <div className="info-item">
                            <label className="form-label fw-semibold text-muted">
                              Description
                            </label>
                            <p className="text-dark">{event.event_description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="col-lg-4">
                <div className="card glass-card mb-4">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Quick Actions</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-outline-primary glass-btn"
                        onClick={() => navigate(`/subevents/create?eventId=${id}&startDate=${event.event_start_date}`)}
                      >
                        <FaPlus className="me-2" />
                        Add Sub Event
                      </button>
                      <button 
                        className="btn btn-outline-success glass-btn"
                        onClick={() => navigate(`/guests/create?eventId=${id}`)}
                      >
                        <FaUsers className="me-2" />
                        Manage Guests
                      </button>
                      <button 
                        className="btn btn-outline-info glass-btn"
                        onClick={() => navigate(`/events/${id}/reports`)}
                      >
                        <FaChartBar className="me-2" />
                        View Reports
                      </button>
                    </div>
                  </div>
                </div>

                {/* RSVP Status */}
                <div className="card glass-card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">RSVP Status</h6>
                  </div>
                  <div className="card-body">
                    {eventStats?.totalGuests > 0 ? (
                      <>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Confirmed</span>
                            <span>{eventStats.confirmedGuests}/{eventStats.totalGuests}</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              style={{ 
                                width: `${(eventStats.confirmedGuests / eventStats.totalGuests) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Pending</span>
                            <span>{eventStats.pendingRSVPs}/{eventStats.totalGuests}</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className="progress-bar bg-warning" 
                              style={{ 
                                width: `${(eventStats.pendingRSVPs / eventStats.totalGuests) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-3">
                        <FaUsers className="text-muted mb-2" size={24} />
                        <p className="text-muted mb-2">No guests added yet</p>
                        <button 
                          className="btn btn-sm btn-primary glass-btn-primary"
                          onClick={() => navigate(`/guests/create?eventId=${id}`)}
                        >
                          Add First Guest
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'subevents' && (
            <div className="col-12">
              <div className="card glass-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <FaClipboardList className="me-2 text-primary" />
                    Sub Events
                  </h5>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/subevents/create?eventId=${id}`)}
                  >
                    <FaPlus className="me-2" />
                    Add Sub Event
                  </button>
                </div>
                <div className="card-body">
                  {subevents.length === 0 ? (
                    <div className="text-center py-4">
                      <FaClipboardList className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No sub events yet</h5>
                      <p className="text-muted mb-3">Sub events help organize your main event into smaller, manageable parts.</p>
                      <button 
                        className="btn btn-primary glass-btn-primary"
                        onClick={() => navigate(`/subevents/create?eventId=${id}`)}
                      >
                        Create First Sub Event
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Sub Event</th>
                            <th>Date & Time</th>
                            <th>Venue</th>
                            <th>Guests</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subevents.map((subevent) => (
                            <tr key={subevent.subevent_id}>
                              <td>
                                <div>
                                  <div className="fw-semibold">{subevent.subevent_name}</div>
                                  {subevent.subevent_description && (
                                    <small className="text-muted">
                                      {subevent.subevent_description.substring(0, 50)}...
                                    </small>
                                  )}
                                </div>
                              </td>
                              <td>
                                {subevent.subevent_start_datetime ? (
                                  <small>
                                    {new Date(subevent.subevent_start_datetime).toLocaleString()}
                                  </small>
                                ) : (
                                  <span className="text-muted">Not set</span>
                                )}
                              </td>
                              <td>
                                {subevent.venue_name || <span className="text-muted">TBD</span>}
                              </td>
                              <td>
                                <span className="badge bg-info glass-badge">
                                  {subevent.guest_count || 0}
                                </span>
                              </td>
                              <td>
                                <span className={`badge glass-badge ${getStatusBadgeClass(subevent.subevent_status)}`}>
                                  {subevent.subevent_status}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-outline-info glass-btn"
                                    onClick={() => navigate(`/subevents/${subevent.subevent_id}`)}
                                    title="View Details"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-primary glass-btn"
                                    onClick={() => navigate(`/subevents/${subevent.subevent_id}/edit`)}
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guests' && (
            <div className="col-12">
              <div className="card glass-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <FaUsers className="me-2 text-primary" />
                    Event Guests
                  </h5>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/guests/create?eventId=${id}`)}
                  >
                    <FaPlus className="me-2" />
                    Add Guest
                  </button>
                </div>
                <div className="card-body">
                  {guests.length === 0 ? (
                    <div className="text-center py-4">
                      <FaUsers className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No guests added yet</h5>
                      <p className="text-muted mb-3">Start adding guests to send invitations and track RSVPs.</p>
                      <div className="d-flex gap-2 justify-content-center">
                        <button 
                          className="btn btn-primary glass-btn-primary"
                          onClick={() => navigate(`/guests/create?eventId=${id}`)}
                        >
                          Add Guest
                        </button>
                        <button 
                          className="btn btn-outline-primary glass-btn"
                          onClick={() => navigate(`/guests/import?eventId=${id}`)}
                        >
                          Import Guests
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Guest Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>RSVP Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {guests.slice(0, 10).map((guest) => {
                            const currentRsvpStatus = guest.rsvp?.rsvp_status || guest.rsvp_status || 'Pending';
                            return (
                              <tr key={guest.guest_id}>
                                <td>
                                  <div className="fw-semibold">
                                    {guest.guest_first_name} {guest.guest_last_name}
                                  </div>
                                </td>
                                <td>{guest.guest_email || '-'}</td>
                                <td>{guest.guest_phone || '-'}</td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={currentRsvpStatus}
                                    onChange={(e) => handleRsvpStatusChange(guest.guest_id, e.target.value)}
                                    style={{
                                      width: 'auto',
                                      backgroundColor:
                                        currentRsvpStatus === 'Confirmed' || currentRsvpStatus === 'Attending' ? '#d4edda' :
                                        currentRsvpStatus === 'Not Attending' || currentRsvpStatus === 'Declined' ? '#f8d7da' :
                                        currentRsvpStatus === 'Maybe' || currentRsvpStatus === 'Tentative' ? '#fff3cd' :
                                        '#e2e3e5',
                                      border: '1px solid',
                                      borderColor:
                                        currentRsvpStatus === 'Confirmed' || currentRsvpStatus === 'Attending' ? '#c3e6cb' :
                                        currentRsvpStatus === 'Not Attending' || currentRsvpStatus === 'Declined' ? '#f5c6cb' :
                                        currentRsvpStatus === 'Maybe' || currentRsvpStatus === 'Tentative' ? '#ffeaa7' :
                                        '#d3d4d5',
                                      fontWeight: '500'
                                    }}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Attending">Attending</option>
                                    <option value="Not Attending">Not Attending</option>
                                    <option value="Declined">Declined</option>
                                    <option value="Maybe">Maybe</option>
                                    <option value="Tentative">Tentative</option>
                                  </select>
                                </td>
                                <td>
                                  <div className="btn-group" role="group">
                                    <button
                                      className="btn btn-sm btn-outline-info glass-btn"
                                      onClick={() => navigate(`/guests/${guest.guest_id}`)}
                                      title="View Details"
                                    >
                                      <FaEye />
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-primary glass-btn"
                                      onClick={() => navigate(`/guests/${guest.guest_id}/edit`)}
                                      title="Edit Guest"
                                    >
                                      <FaEdit />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {guests.length > 10 && (
                        <div className="text-center mt-3">
                          <button 
                            className="btn btn-outline-primary glass-btn"
                            onClick={() => navigate(`/guests?eventId=${id}`)}
                          >
                            View All {guests.length} Guests
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040 
            }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowDeleteModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete event <strong>{event.event_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> This will also delete:
                      <ul className="mb-0 mt-2">
                        <li>{subevents.length} sub events</li>
                        <li>{guests.length} guest records</li>
                        <li>All RSVP responses</li>
                        <li>All related allocations and bookings</li>
                      </ul>
                    </div>
                    <div className="alert alert-danger">
                      <small>This action cannot be undone.</small>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger glass-btn-danger"
                      onClick={handleDelete}
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;