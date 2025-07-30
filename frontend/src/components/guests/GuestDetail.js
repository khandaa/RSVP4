import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaEnvelope, 
  FaPhone,
  FaBuilding,
  FaMapMarkerAlt,
  FaTags,
  FaUsers,
  FaCalendarAlt,
  FaFileAlt,
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChartBar,
  FaPlus
} from 'react-icons/fa';

const GuestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [guestEvents, setGuestEvents] = useState([]);
  const [guestSubevents, setGuestSubevents] = useState([]);
  const [rsvpHistory, setRsvpHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchGuestData();
  }, [id]);

  const fetchGuestData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch guest details
      const guestResponse = await fetch(`/api/guests/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!guestResponse.ok) {
        throw new Error('Failed to fetch guest');
      }
      
      const guestData = await guestResponse.json();
      setGuest(guestData);

      // Fetch related data
      const [subeventResponse, rsvpResponse] = await Promise.all([
        fetch(`/api/crud/guest-subevent-allocation?guest_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()).catch(() => []),
        fetch(`/api/crud/rsvp-responses?guest_id=${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()).catch(() => [])
      ]);

      setGuestSubevents(subeventResponse || []);
      setRsvpHistory(rsvpResponse || []);

    } catch (error) {
      console.error('Error fetching guest data:', error);
      toast.error('Failed to fetch guest details');
      navigate('/guests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/guests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete guest');
      }

      toast.success('Guest deleted successfully');
      navigate('/guests');
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to delete guest');
      setShowDeleteModal(false);
    }
  };

  const getRSVPBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-success';
      case 'Declined': return 'bg-danger';
      case 'Tentative': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const getGuestTypeBadgeClass = (type) => {
    switch (type) {
      case 'VIP': return 'bg-warning';
      case 'Corporate': return 'bg-info';
      case 'Family': return 'bg-success';
      case 'Media': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading guest details...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h4 className="text-muted">Guest not found</h4>
          <button 
            className="btn btn-primary glass-btn-primary mt-3"
            onClick={() => navigate('/guests')}
          >
            Back to Guests
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
              onClick={() => navigate('/guests')}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">
                {guest.guest_first_name} {guest.guest_last_name}
              </h2>
              <p className="text-muted mb-0">Guest Profile</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={() => navigate(`/guests/${id}/edit`)}
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
                <FaCalendarAlt className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{guestEvents.length}</h4>
                <small className="text-muted">Events</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClipboardList className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{guestSubevents.length}</h4>
                <small className="text-muted">Sub Events</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCheckCircle className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">
                  {rsvpHistory.filter(r => r.rsvp_status === 'Confirmed').length}
                </h4>
                <small className="text-muted">Confirmed RSVPs</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">
                  {rsvpHistory.filter(r => r.rsvp_status === 'Pending' || !r.rsvp_status).length}
                </h4>
                <small className="text-muted">Pending RSVPs</small>
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
                  className={`nav-link glass-btn ${activeTab === 'events' ? 'active' : ''}`}
                  onClick={() => setActiveTab('events')}
                >
                  <FaCalendarAlt className="me-2" />
                  Events ({guestSubevents.length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'rsvp' ? 'active' : ''}`}
                  onClick={() => setActiveTab('rsvp')}
                >
                  <FaClipboardList className="me-2" />
                  RSVP History ({rsvpHistory.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Content */}
        <div className="row g-4">
          {activeTab === 'overview' && (
            <>
              {/* Guest Information */}
              <div className="col-lg-8">
                <div className="card glass-card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <FaUser className="me-2 text-primary" />
                      Guest Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaUser className="me-2" />
                            Full Name
                          </label>
                          <p className="fs-5 fw-semibold text-dark">
                            {guest.guest_first_name} {guest.guest_last_name}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaTags className="me-2" />
                            Guest Type
                          </label>
                          <div>
                            {guest.guest_type ? (
                              <span className={`badge glass-badge fs-6 ${getGuestTypeBadgeClass(guest.guest_type)}`}>
                                {guest.guest_type}
                              </span>
                            ) : (
                              <span className="text-muted">Not specified</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaEnvelope className="me-2" />
                            Email
                          </label>
                          <p className="text-dark">
                            {guest.guest_email || <span className="text-muted">Not provided</span>}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaPhone className="me-2" />
                            Phone
                          </label>
                          <p className="text-dark">
                            {guest.guest_phone || <span className="text-muted">Not provided</span>}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaBuilding className="me-2" />
                            Organization
                          </label>
                          <p className="text-dark">
                            {guest.guest_organization || <span className="text-muted">Not specified</span>}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            Designation
                          </label>
                          <p className="text-dark">
                            {guest.guest_designation || <span className="text-muted">Not specified</span>}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            RSVP Status
                          </label>
                          <div>
                            <span className={`badge glass-badge fs-6 ${getRSVPBadgeClass(guest.guest_rsvp_status)}`}>
                              {guest.guest_rsvp_status || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaUsers className="me-2" />
                            Guest Group
                          </label>
                          <p className="text-dark">
                            {guest.group_name ? (
                              <span className="badge bg-info glass-badge">
                                {guest.group_name}
                              </span>
                            ) : (
                              <span className="text-muted">No group assigned</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Address Information */}
                      {(guest.guest_address || guest.guest_city || guest.guest_state || guest.guest_country) && (
                        <div className="col-12">
                          <div className="info-item">
                            <label className="form-label fw-semibold text-muted">
                              <FaMapMarkerAlt className="me-2" />
                              Address
                            </label>
                            <div className="text-dark">
                              {guest.guest_address && <div>{guest.guest_address}</div>}
                              <div>
                                {[guest.guest_city, guest.guest_state, guest.guest_country]
                                  .filter(Boolean)
                                  .join(', ')
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Information */}
                      {guest.guest_dietary_preferences && (
                        <div className="col-md-6">
                          <div className="info-item">
                            <label className="form-label fw-semibold text-muted">
                              Dietary Preferences
                            </label>
                            <p className="text-dark">{guest.guest_dietary_preferences}</p>
                          </div>
                        </div>
                      )}

                      {guest.guest_special_requirements && (
                        <div className="col-md-6">
                          <div className="info-item">
                            <label className="form-label fw-semibold text-muted">
                              Special Requirements
                            </label>
                            <p className="text-dark">{guest.guest_special_requirements}</p>
                          </div>
                        </div>
                      )}

                      {guest.guest_notes && (
                        <div className="col-12">
                          <div className="info-item">
                            <label className="form-label fw-semibold text-muted">
                              <FaFileAlt className="me-2" />
                              Internal Notes
                            </label>
                            <p className="text-dark">{guest.guest_notes}</p>
                          </div>
                        </div>
                      )}

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            Created Date
                          </label>
                          <p className="text-dark">{formatDate(guest.created_at)}</p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            Last Updated
                          </label>
                          <p className="text-dark">{formatDate(guest.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Event Info */}
              <div className="col-lg-4">
                <div className="card glass-card mb-4">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Quick Actions</h6>
                  </div>
                  <div className="card-body">
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-outline-primary glass-btn"
                        onClick={() => navigate(`/rsvp/send?guestId=${id}`)}
                      >
                        <FaEnvelope className="me-2" />
                        Send RSVP
                      </button>
                      <button 
                        className="btn btn-outline-success glass-btn"
                        onClick={() => navigate(`/guests/${id}/allocate`)}
                      >
                        <FaPlus className="me-2" />
                        Allocate to Sub Event
                      </button>
                      <button 
                        className="btn btn-outline-info glass-btn"
                        onClick={() => navigate(`/guests/${id}/documents`)}
                      >
                        <FaFileAlt className="me-2" />
                        Manage Documents
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event Association */}
                <div className="card glass-card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Event Association</h6>
                  </div>
                  <div className="card-body">
                    {guest.event_name ? (
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="text-primary me-2" />
                        <div>
                          <div className="fw-semibold">{guest.event_name}</div>
                          <small className="text-muted">{guest.client_name}</small>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <FaCalendarAlt className="text-muted mb-2" size={24} />
                        <p className="text-muted mb-0">No event association</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'events' && (
            <div className="col-12">
              <div className="card glass-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <FaCalendarAlt className="me-2 text-primary" />
                    Sub Event Allocations
                  </h5>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/guests/${id}/allocate`)}
                  >
                    <FaPlus className="me-2" />
                    Add Allocation
                  </button>
                </div>
                <div className="card-body">
                  {guestSubevents.length === 0 ? (
                    <div className="text-center py-4">
                      <FaClipboardList className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No sub event allocations</h5>
                      <p className="text-muted mb-3">This guest is not allocated to any sub events yet.</p>
                      <button 
                        className="btn btn-primary glass-btn-primary"
                        onClick={() => navigate(`/guests/${id}/allocate`)}
                      >
                        Allocate to Sub Event
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
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {guestSubevents.map((allocation) => (
                            <tr key={allocation.allocation_id}>
                              <td>
                                <div className="fw-semibold">{allocation.subevent_name}</div>
                                {allocation.subevent_description && (
                                  <small className="text-muted">
                                    {allocation.subevent_description.substring(0, 50)}...
                                  </small>
                                )}
                              </td>
                              <td>
                                {allocation.subevent_start_datetime ? (
                                  <small>{formatDateTime(allocation.subevent_start_datetime)}</small>
                                ) : (
                                  <span className="text-muted">Not scheduled</span>
                                )}
                              </td>
                              <td>
                                {allocation.venue_name ? (
                                  <div>
                                    <div className="fw-semibold">{allocation.venue_name}</div>
                                    {allocation.room_name && (
                                      <small className="text-muted">{allocation.room_name}</small>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted">TBD</span>
                                )}
                              </td>
                              <td>
                                <span className="badge bg-success glass-badge">
                                  Allocated
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-info glass-btn"
                                  onClick={() => navigate(`/subevents/${allocation.subevent_id}`)}
                                  title="View Sub Event"
                                >
                                  <FaEye />
                                </button>
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

          {activeTab === 'rsvp' && (
            <div className="col-12">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaClipboardList className="me-2 text-primary" />
                    RSVP History
                  </h5>
                </div>
                <div className="card-body">
                  {rsvpHistory.length === 0 ? (
                    <div className="text-center py-4">
                      <FaClipboardList className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No RSVP history</h5>
                      <p className="text-muted mb-3">No RSVP responses recorded for this guest.</p>
                      <button 
                        className="btn btn-primary glass-btn-primary"
                        onClick={() => navigate(`/rsvp/send?guestId=${id}`)}
                      >
                        Send RSVP Invitation
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Response</th>
                            <th>Response Date</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rsvpHistory.map((rsvp) => (
                            <tr key={rsvp.response_id}>
                              <td>
                                <div className="fw-semibold">{rsvp.event_name}</div>
                                {rsvp.subevent_name && (
                                  <small className="text-muted">{rsvp.subevent_name}</small>
                                )}
                              </td>
                              <td>
                                <span className={`badge glass-badge ${getRSVPBadgeClass(rsvp.rsvp_status)}`}>
                                  {rsvp.rsvp_status || 'Pending'}
                                </span>
                              </td>
                              <td>
                                {rsvp.response_date ? (
                                  formatDateTime(rsvp.response_date)
                                ) : (
                                  <span className="text-muted">No response</span>
                                )}
                              </td>
                              <td>
                                {rsvp.guest_notes ? (
                                  <div style={{ maxWidth: '200px' }}>
                                    {rsvp.guest_notes.length > 50 
                                      ? `${rsvp.guest_notes.substring(0, 50)}...`
                                      : rsvp.guest_notes
                                    }
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
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
                    <p>Are you sure you want to delete guest <strong>{guest.guest_first_name} {guest.guest_last_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> This will also delete:
                      <ul className="mb-0 mt-2">
                        <li>{guestSubevents.length} sub event allocations</li>
                        <li>{rsvpHistory.length} RSVP responses</li>
                        <li>All related guest data and history</li>
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
                      Delete Guest
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

export default GuestDetail;