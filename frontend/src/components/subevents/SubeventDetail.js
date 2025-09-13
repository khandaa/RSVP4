import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaTags,
  FaUsers,
  FaClipboardList,
  FaFileAlt,
  FaChartBar,
  FaPlus,
  FaEye,
} from 'react-icons/fa';

const SubeventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subevent, setSubevent] = useState(null);
  const [parentEvent, setParentEvent] = useState(null);
  const [guestAllocations, setGuestAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchSubeventData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch subevent details
      const subeventResponse = await fetch(`/api/crud/event-schedule/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!subeventResponse.ok) {
        throw new Error('Failed to fetch subevent');
      }
      
      const subeventData = await subeventResponse.json();
      setSubevent(subeventData);

      // Fetch parent event details
      if (subeventData.event_id) {
        try {
          const eventResponse = await fetch(`/api/events/${subeventData.event_id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getToken()}`
            }
          });
          if (eventResponse.ok) {
            const eventData = await eventResponse.json();
            setParentEvent(eventData);
          }
        } catch (error) {
          console.error('Error fetching parent event:', error);
        }
      }

      // Fetch guest allocations for this subevent
      try {
        const guestResponse = await fetch(`/api/crud/guest-subevent-allocation?subevent_id=${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (guestResponse.ok) {
          const guestData = await guestResponse.json();
          setGuestAllocations(guestData || []);
        }
      } catch (error) {
        console.error('Error fetching guest allocations:', error);
        setGuestAllocations([]);
      }

    } catch (error) {
      console.error('Error fetching subevent data:', error);
      toast.error('Failed to fetch subevent details');
      navigate('/subevents');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchSubeventData();
  }, [id, fetchSubeventData]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/crud/event-schedule/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete subevent');
      }

      toast.success('Sub event deleted successfully');
      if (subevent?.event_id) {
        navigate(`/subevents?eventId=${subevent.event_id}`);
      } else {
        navigate('/subevents');
      }
    } catch (error) {
      console.error('Error deleting subevent:', error);
      toast.error('Failed to delete sub event');
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

  const formatDateTime = (datetime) => {
    if (!datetime) return 'Not set';
    return new Date(datetime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDuration = () => {
    if (!subevent?.subevent_start_datetime || !subevent?.subevent_end_datetime) return 'Not specified';
    
    const start = new Date(subevent.subevent_start_datetime);
    const end = new Date(subevent.subevent_end_datetime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      return `${diffHours} hours`;
    } else {
      const diffDays = Math.round(diffHours / 24 * 10) / 10;
      return `${diffDays} days`;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading subevent details...</p>
        </div>
      </div>
    );
  }

  if (!subevent) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h4 className="text-muted">Sub event not found</h4>
          <button 
            className="btn btn-primary glass-btn-primary mt-3"
            onClick={() => navigate('/subevents')}
          >
            Back to Sub Events
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
              onClick={() => subevent.event_id 
                ? navigate(`/subevents?eventId=${subevent.event_id}`)
                : navigate('/subevents')
              }
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">{subevent.subevent_name}</h2>
              <p className="text-muted mb-0">Sub Event Dashboard</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={() => navigate(`/subevents/${id}/edit`)}
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

        {/* Parent Event Info */}
        {parentEvent && (
          <div className="card glass-card mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <FaCalendarAlt className="text-primary me-2" />
                    <div>
                      <div className="fw-semibold">{parentEvent.event_name}</div>
                      <small className="text-muted">Parent Event</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <span className="badge bg-info glass-badge">
                    {parentEvent.event_status}
                  </span>
                </div>
                <div className="col-md-3">
                  <button 
                    className="btn btn-sm btn-outline-primary glass-btn"
                    onClick={() => navigate(`/events/${parentEvent.event_id}`)}
                  >
                    <FaEye className="me-1" />
                    View Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaUsers className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{guestAllocations.length}</h4>
                <small className="text-muted">Allocated Guests</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaMapMarkerAlt className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">
                  {subevent.venue_name ? 1 : 0}
                </h4>
                <small className="text-muted">Venue Assigned</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">
                  {subevent.subevent_start_datetime ? '1' : '0'}
                </h4>
                <small className="text-muted">Scheduled</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaChartBar className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">
                  {subevent.capacity || 0}
                </h4>
                <small className="text-muted">Capacity</small>
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
                  className={`nav-link glass-btn ${activeTab === 'guests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('guests')}
                >
                  <FaUsers className="me-2" />
                  Guests ({guestAllocations.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Content */}
        <div className="row g-4">
          {activeTab === 'overview' && (
            <>
              {/* Subevent Information */}
              <div className="col-lg-8">
                <div className="card glass-card h-100">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <FaClipboardList className="me-2 text-primary" />
                      Sub Event Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaClipboardList className="me-2" />
                            Name
                          </label>
                          <p className="fs-5 fw-semibold text-dark">{subevent.subevent_name}</p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaTags className="me-2" />
                            Status
                          </label>
                          <div>
                            <span className={`badge glass-badge fs-6 ${getStatusBadgeClass(subevent.subevent_status)}`}>
                              {subevent.subevent_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaClock className="me-2" />
                            Start Date & Time
                          </label>
                          <p className="text-dark">
                            {formatDateTime(subevent.subevent_start_datetime)}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaClock className="me-2" />
                            End Date & Time
                          </label>
                          <p className="text-dark">
                            {formatDateTime(subevent.subevent_end_datetime)}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            Duration
                          </label>
                          <p className="text-dark">{getDuration()}</p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaUsers className="me-2" />
                            Capacity
                          </label>
                          <p className="text-dark">{subevent.capacity || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            <FaMapMarkerAlt className="me-2" />
                            Venue
                          </label>
                          <p className="text-dark">
                            {subevent.venue_name ? (
                              <span className="badge bg-success glass-badge">
                                {subevent.venue_name}
                              </span>
                            ) : (
                              <span className="text-muted">Not assigned</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="info-item">
                          <label className="form-label fw-semibold text-muted">
                            Room
                          </label>
                          <p className="text-dark">
                            {subevent.room_name ? (
                              <span className="badge bg-info glass-badge">
                                {subevent.room_name}
                              </span>
                            ) : (
                              <span className="text-muted">Not assigned</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {subevent.subevent_description && (
                        <div className="col-12">
                          <div className="info-item">
                            <label className="form-label fw-semibold text-muted">
                              <FaFileAlt className="me-2" />
                              Description
                            </label>
                            <p className="text-dark">{subevent.subevent_description}</p>
                          </div>
                        </div>
                      )}

                      {subevent.special_requirements && (
                        <div className="col-12">
                          <div className="info-item">
                            <label className="form-label fw-semibold text-muted">
                              Special Requirements
                            </label>
                            <p className="text-dark">{subevent.special_requirements}</p>
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
                        className="btn btn-outline-success glass-btn"
                        onClick={() => navigate(`/guests?subeventId=${id}`)}
                      >
                        <FaUsers className="me-2" />
                        Manage Guests
                      </button>
                      <button 
                        className="btn btn-outline-info glass-btn"
                        onClick={() => navigate(`/subevents/${id}/allocation`)}
                      >
                        <FaMapMarkerAlt className="me-2" />
                        Venue Allocation
                      </button>
                      <button 
                        className="btn btn-outline-primary glass-btn"
                        onClick={() => navigate(`/subevents/${id}/timeline`)}
                      >
                        <FaClock className="me-2" />
                        View Timeline
                      </button>
                    </div>
                  </div>
                </div>

                {/* Capacity Status */}
                <div className="card glass-card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Capacity Status</h6>
                  </div>
                  <div className="card-body">
                    {subevent.capacity ? (
                      <>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Allocated</span>
                            <span>{guestAllocations.length}/{subevent.capacity}</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className={`progress-bar ${
                                guestAllocations.length > subevent.capacity ? 'bg-danger' : 
                                guestAllocations.length === subevent.capacity ? 'bg-success' : 'bg-primary'
                              }`}
                              style={{ 
                                width: `${Math.min((guestAllocations.length / subevent.capacity) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        {guestAllocations.length > subevent.capacity && (
                          <div className="text-danger small">
                            ⚠️ Over capacity by {guestAllocations.length - subevent.capacity}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-3">
                        <FaUsers className="text-muted mb-2" size={24} />
                        <p className="text-muted mb-2">No capacity limit set</p>
                        <small className="text-muted">
                          {guestAllocations.length} guests allocated
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'guests' && (
            <div className="col-12">
              <div className="card glass-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <FaUsers className="me-2 text-primary" />
                    Allocated Guests
                  </h5>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/guests/allocate?subeventId=${id}`)}
                  >
                    <FaPlus className="me-2" />
                    Allocate Guests
                  </button>
                </div>
                <div className="card-body">
                  {guestAllocations.length === 0 ? (
                    <div className="text-center py-4">
                      <FaUsers className="text-muted mb-3" size={48} />
                      <h5 className="text-muted">No guests allocated yet</h5>
                      <p className="text-muted mb-3">Allocate guests to this sub event to track attendance.</p>
                      <button 
                        className="btn btn-primary glass-btn-primary"
                        onClick={() => navigate(`/guests/allocate?subeventId=${id}`)}
                      >
                        Allocate First Guest
                      </button>
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
                          {guestAllocations.slice(0, 10).map((allocation) => (
                            <tr key={allocation.allocation_id}>
                              <td>
                                <div className="fw-semibold">
                                  {allocation.guest_first_name} {allocation.guest_last_name}
                                </div>
                              </td>
                              <td>{allocation.guest_email || '-'}</td>
                              <td>{allocation.guest_phone || '-'}</td>
                              <td>
                                <span className={`badge glass-badge ${
                                  allocation.rsvp_status === 'Confirmed' ? 'bg-success' :
                                  allocation.rsvp_status === 'Declined' ? 'bg-danger' :
                                  'bg-warning'
                                }`}>
                                  {allocation.rsvp_status || 'Pending'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-info glass-btn"
                                  onClick={() => navigate(`/guests/${allocation.guest_id}`)}
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {guestAllocations.length > 10 && (
                        <div className="text-center mt-3">
                          <button 
                            className="btn btn-outline-primary glass-btn"
                            onClick={() => navigate(`/guests?subeventId=${id}`)}
                          >
                            View All {guestAllocations.length} Guests
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
                    <p>Are you sure you want to delete sub event <strong>{subevent.subevent_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> This will also delete:
                      <ul className="mb-0 mt-2">
                        <li>{guestAllocations.length} guest allocations</li>
                        <li>All venue and room assignments</li>
                        <li>Any related booking information</li>
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
                      Delete Sub Event
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

export default SubeventDetail;