import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaEye, 
  FaEdit,
  FaClock, 
  FaMapMarkerAlt,
  FaUsers,
  FaCalendarAlt,
  FaClipboardList,
  FaFilter,
  FaList
} from 'react-icons/fa';
import { eventAPI } from '../../services/api';

const SubeventTimeline = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [subevents, setSubevents] = useState([]);
  const [filteredSubevents, setFilteredSubevents] = useState([]);
  const [parentEvent, setParentEvent] = useState(null);
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [subeventResponse, eventResponse, venuesResponse] = await Promise.all([
        eventAPI.getEventSchedule(eventId),
        eventAPI.getEvent(eventId),
        fetch('/api/venues').then(res => res.json())
      ]);
      
      setSubevents(subeventResponse.data || []);
      setParentEvent(eventResponse.data);
      setVenues(venuesResponse || []);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      toast.error('Failed to fetch timeline data');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const filterSubevents = useCallback(() => {
    let filtered = [...subevents];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(subevent => subevent.subevent_status === statusFilter);
    }

    if (venueFilter !== 'all') {
      filtered = filtered.filter(subevent => subevent.venue_id === parseInt(venueFilter));
    }

    // Sort by start datetime
    filtered.sort((a, b) => {
      const aDate = a.subevent_start_datetime ? new Date(a.subevent_start_datetime) : new Date(0);
      const bDate = b.subevent_start_datetime ? new Date(b.subevent_start_datetime) : new Date(0);
      return aDate.getTime() - bDate.getTime();
    });

    setFilteredSubevents(filtered);
  }, [subevents, statusFilter, venueFilter]);

  useEffect(() => {
    if (eventId) {
      fetchData();
    } else {
      navigate('/subevents');
    }
  }, [eventId, fetchData, navigate]);

  useEffect(() => {
    filterSubevents();
  }, [filterSubevents]);

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
    if (!datetime) return { date: 'TBD', time: '' };
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getDuration = (startDateTime, endDateTime) => {
    if (!startDateTime || !endDateTime) return '';
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.round(diffHours / 24 * 10) / 10;
      return `${diffDays}d`;
    }
  };

  const groupByDate = (subevents) => {
    const groups = {};
    subevents.forEach(subevent => {
      const dateKey = subevent.subevent_start_datetime 
        ? new Date(subevent.subevent_start_datetime).toDateString()
        : 'No Date';
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(subevent);
    });
    return groups;
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading timeline...</p>
        </div>
      </div>
    );
  }

  const groupedSubevents = groupByDate(filteredSubevents);

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={() => navigate(`/events/${eventId}`)}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">
                {parentEvent?.event_name} - Timeline
              </h2>
              <p className="text-muted">Visual timeline of sub events</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => navigate(`/subevents?eventId=${eventId}`)}
            >
              <FaList className="me-2" />
              List View
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => navigate(`/subevents/create?eventId=${eventId}`)}
            >
              <FaPlus className="me-2" />
              Add Sub Event
            </button>
          </div>
        </div>

        {/* Parent Event Info */}
        {parentEvent && (
          <div className="card glass-card mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-md-4">
                  <div className="d-flex align-items-center">
                    <FaCalendarAlt className="text-primary me-2" />
                    <div>
                      <div className="fw-semibold">{parentEvent.event_name}</div>
                      <small className="text-muted">Parent Event</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <span className={`badge glass-badge ${getStatusBadgeClass(parentEvent.event_status)}`}>
                    {parentEvent.event_status}
                  </span>
                </div>
                <div className="col-md-3">
                  <div className="d-flex align-items-center">
                    <FaClock className="text-muted me-1" size={12} />
                    <small>
                      {parentEvent.event_start_date 
                        ? new Date(parentEvent.event_start_date).toLocaleDateString()
                        : 'No date set'
                      }
                    </small>
                  </div>
                </div>
                <div className="col-md-3 text-end">
                  <span className="badge bg-info glass-badge">
                    {filteredSubevents.length} Sub Events
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-3">
                <div className="d-flex align-items-center">
                  <FaFilter className="text-muted me-2" />
                  <span className="fw-semibold">Filters:</span>
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                >
                  <option value="all">All Venues</option>
                  {venues.map(venue => (
                    <option key={venue.venue_id} value={venue.venue_id}>
                      {venue.venue_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 text-end">
                <small className="text-muted">
                  Showing {filteredSubevents.length} of {subevents.length} sub events
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card glass-card">
          <div className="card-body p-0">
            {Object.keys(groupedSubevents).length === 0 ? (
              <div className="text-center py-5">
                <FaClipboardList className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No sub events found</h5>
                <p className="text-muted mb-3">Create sub events to see them in the timeline.</p>
                <button 
                  className="btn btn-primary glass-btn-primary"
                  onClick={() => navigate(`/subevents/create?eventId=${eventId}`)}
                >
                  Create First Sub Event
                </button>
              </div>
            ) : (
              <div className="timeline-container p-4">
                {Object.entries(groupedSubevents).map(([dateKey, dateSubevents]) => (
                  <div key={dateKey} className="timeline-date-group mb-5">
                    {/* Date Header */}
                    <div className="timeline-date-header mb-4">
                      <div className="date-badge">
                        <FaCalendarAlt className="me-2" />
                        {dateKey === 'No Date' ? 'Unscheduled' : 
                          new Date(dateKey).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        }
                      </div>
                      <div className="timeline-line"></div>
                    </div>

                    {/* Sub Events for this date */}
                    <div className="timeline-events">
                      {dateSubevents.map((subevent, index) => {
                        const { time } = formatDateTime(subevent.subevent_start_datetime);
                        const duration = getDuration(
                          subevent.subevent_start_datetime, 
                          subevent.subevent_end_datetime
                        );

                        return (
                          <div key={subevent.subevent_id} className="timeline-event mb-4">
                            <div className="timeline-marker">
                              <div className={`timeline-dot ${getStatusBadgeClass(subevent.subevent_status).replace('bg-', '')}`}>
                                <FaClipboardList size={12} />
                              </div>
                              {index < dateSubevents.length - 1 && (
                                <div className="timeline-connector"></div>
                              )}
                            </div>
                            
                            <div className="timeline-content">
                              <div 
                                className="timeline-card card glass-card h-100"
                                onClick={() => setSelectedEvent(subevent)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="card-title fw-bold mb-0">
                                      {subevent.subevent_name}
                                    </h6>
                                    <span className={`badge glass-badge ${getStatusBadgeClass(subevent.subevent_status)}`}>
                                      {subevent.subevent_status}
                                    </span>
                                  </div>

                                  {subevent.subevent_description && (
                                    <p className="card-text text-muted mb-3" style={{ fontSize: '0.9em' }}>
                                      {subevent.subevent_description.substring(0, 120)}
                                      {subevent.subevent_description.length > 120 ? '...' : ''}
                                    </p>
                                  )}

                                  <div className="row g-2 text-muted" style={{ fontSize: '0.85em' }}>
                                    <div className="col-6">
                                      <div className="d-flex align-items-center mb-1">
                                        <FaClock className="me-2" size={12} />
                                        <span>{time || 'No time set'}</span>
                                      </div>
                                      {duration && (
                                        <div className="d-flex align-items-center">
                                          <span className="ms-4">Duration: {duration}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex align-items-center mb-1">
                                        <FaMapMarkerAlt className="me-2" size={12} />
                                        <span>{subevent.venue_name || 'TBD'}</span>
                                      </div>
                                      {subevent.room_name && (
                                        <div className="d-flex align-items-center">
                                          <span className="ms-4">{subevent.room_name}</span>
                                        </div>
                                      )}
                                    </div>
                                    {subevent.capacity && (
                                      <div className="col-6">
                                        <div className="d-flex align-items-center">
                                          <FaUsers className="me-2" size={12} />
                                          <span>Capacity: {subevent.capacity}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-3 pt-2 border-top">
                                    <div className="btn-group btn-group-sm" role="group">
                                      <button
                                        className="btn btn-outline-info glass-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/subevents/${subevent.subevent_id}`);
                                        }}
                                        title="View Details"
                                      >
                                        <FaEye />
                                      </button>
                                      <button
                                        className="btn btn-outline-primary glass-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/subevents/${subevent.subevent_id}/edit`);
                                        }}
                                        title="Edit"
                                      >
                                        <FaEdit />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
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
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content glass-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">{selectedEvent.subevent_name}</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSelectedEvent(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2">
                          <span className="me-2"><strong>Status:</strong></span>
                          <span className={`badge glass-badge ${getStatusBadgeClass(selectedEvent.subevent_status)}`}>
                            {selectedEvent.subevent_status}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2">
                          <FaUsers className="text-primary me-2" />
                          <strong>Capacity:</strong>
                          <span className="ms-2">{selectedEvent.capacity || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center mb-2">
                          <FaClock className="text-primary me-2" />
                          <strong>Schedule:</strong>
                          <span className="ms-2">
                            {formatDateTime(selectedEvent.subevent_start_datetime).date} {formatDateTime(selectedEvent.subevent_start_datetime).time}
                            {selectedEvent.subevent_end_datetime && 
                              ` - ${formatDateTime(selectedEvent.subevent_end_datetime).time}`
                            }
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="d-flex align-items-center mb-2">
                          <FaMapMarkerAlt className="text-primary me-2" />
                          <strong>Location:</strong>
                          <span className="ms-2">
                            {selectedEvent.venue_name || 'TBD'}
                            {selectedEvent.room_name && ` - ${selectedEvent.room_name}`}
                          </span>
                        </div>
                      </div>
                      {selectedEvent.subevent_description && (
                        <div className="col-12">
                          <strong>Description:</strong>
                          <p className="mt-1 text-muted">{selectedEvent.subevent_description}</p>
                        </div>
                      )}
                      {selectedEvent.special_requirements && (
                        <div className="col-12">
                          <strong>Special Requirements:</strong>
                          <p className="mt-1 text-muted">{selectedEvent.special_requirements}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary glass-btn-primary"
                      onClick={() => {
                        navigate(`/subevents/${selectedEvent.subevent_id}`);
                        setSelectedEvent(null);
                      }}
                    >
                      <FaEye className="me-2" />
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for Timeline */}
      <style jsx>{`
        .timeline-container {
          position: relative;
        }
        
        .timeline-date-header {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .date-badge {
          background: linear-gradient(135deg, #0d6efd, #0a58ca);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
        }
        
        .timeline-line {
          flex: 1;
          height: 2px;
          background: linear-gradient(to right, #0d6efd, transparent);
          margin-left: 20px;
        }
        
        .timeline-events {
          position: relative;
        }
        
        .timeline-event {
          display: flex;
          position: relative;
        }
        
        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 20px;
          position: relative;
        }
        
        .timeline-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          z-index: 1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .timeline-dot.primary {
          background: linear-gradient(135deg, #0d6efd, #0a58ca);
        }
        
        .timeline-dot.warning {
          background: linear-gradient(135deg, #ffc107, #e0a800);
        }
        
        .timeline-dot.success {
          background: linear-gradient(135deg, #198754, #157347);
        }
        
        .timeline-dot.danger {
          background: linear-gradient(135deg, #dc3545, #b02a37);
        }
        
        .timeline-dot.secondary {
          background: linear-gradient(135deg, #6c757d, #5a6268);
        }
        
        .timeline-dot.info {
          background: linear-gradient(135deg, #0dcaf0, #31d2f2);
        }
        
        .timeline-connector {
          width: 2px;
          height: 60px;
          background: linear-gradient(to bottom, #dee2e6, transparent);
          margin-top: 10px;
        }
        
        .timeline-content {
          flex: 1;
          margin-bottom: 20px;
        }
        
        .timeline-card {
          transition: all 0.3s ease;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .timeline-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        @media (max-width: 768px) {
          .timeline-marker {
            margin-right: 15px;
          }
          
          .timeline-dot {
            width: 32px;
            height: 32px;
          }
          
          .date-badge {
            font-size: 0.9em;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default SubeventTimeline;