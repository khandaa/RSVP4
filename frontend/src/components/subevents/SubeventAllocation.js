import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaSave,
  FaMapMarkerAlt,
  FaUsers,
  FaClock,
  FaClipboardList,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { eventAPI } from '../../services/api';

const SubeventAllocation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [subevents, setSubevents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [parentEvent, setParentEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [allocations, setAllocations] = useState({});
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (eventId) {
      fetchData();
    } else {
      navigate('/subevents');
    }
  }, [eventId]);

  useEffect(() => {
    checkConflicts();
  }, [allocations, subevents]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subeventResponse, eventResponse, venuesResponse, roomsResponse] = await Promise.all([
        eventAPI.getEventSchedule(eventId),
        eventAPI.getEvent(eventId),
        fetch('/api/venues').then(res => res.json()),
        fetch('/api/master-data/rooms').then(res => res.json())
      ]);
      
      const subeventData = subeventResponse.data || [];
      setSubevents(subeventData);
      setParentEvent(eventResponse.data);
      setVenues(venuesResponse || []);
      setRooms(roomsResponse || []);

      // Initialize allocations with current values
      const currentAllocations = {};
      subeventData.forEach(subevent => {
        currentAllocations[subevent.subevent_id] = {
          venue_id: subevent.venue_id || '',
          room_id: subevent.room_id || ''
        };
      });
      setAllocations(currentAllocations);
    } catch (error) {
      console.error('Error fetching allocation data:', error);
      toast.error('Failed to fetch allocation data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkConflicts = () => {
    const newConflicts = [];
    const roomBookings = {};

    // Group subevents by room and check for time overlaps
    subevents.forEach(subevent => {
      const allocation = allocations[subevent.subevent_id];
      if (allocation?.room_id && subevent.subevent_start_datetime && subevent.subevent_end_datetime) {
        const roomId = allocation.room_id;
        const startTime = new Date(subevent.subevent_start_datetime);
        const endTime = new Date(subevent.subevent_end_datetime);

        if (!roomBookings[roomId]) {
          roomBookings[roomId] = [];
        }

        // Check for conflicts with existing bookings
        const conflictingBookings = roomBookings[roomId].filter(booking => {
          return (startTime < booking.endTime && endTime > booking.startTime);
        });

        if (conflictingBookings.length > 0) {
          conflictingBookings.forEach(booking => {
            if (!newConflicts.some(c => 
              (c.subevent1 === subevent.subevent_id && c.subevent2 === booking.subeventId) ||
              (c.subevent1 === booking.subeventId && c.subevent2 === subevent.subevent_id)
            )) {
              newConflicts.push({
                subevent1: subevent.subevent_id,
                subevent2: booking.subeventId,
                roomId: roomId,
                room_name: rooms.find(r => r.room_id === parseInt(roomId))?.room_name || 'Unknown Room'
              });
            }
          });
        }

        roomBookings[roomId].push({
          subeventId: subevent.subevent_id,
          startTime,
          endTime
        });
      }
    });

    setConflicts(newConflicts);
  };

  const handleAllocationChange = (subeventId, field, value) => {
    setAllocations(prev => ({
      ...prev,
      [subeventId]: {
        ...prev[subeventId],
        [field]: value,
        // Clear room if venue changes
        ...(field === 'venue_id' && value !== prev[subeventId]?.venue_id ? { room_id: '' } : {})
      }
    }));
  };

  const getAvailableRooms = (venueId) => {
    return rooms.filter(room => room.venue_id === parseInt(venueId));
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
    return new Date(datetime).toLocaleString();
  };

  const isConflicted = (subeventId) => {
    return conflicts.some(conflict => 
      conflict.subevent1 === subeventId || conflict.subevent2 === subeventId
    );
  };

  const handleSaveAllocations = async () => {
    setIsSaving(true);
    
    try {
      const promises = Object.entries(allocations).map(async ([subeventId, allocation]) => {
        const updateData = {
          venue_id: allocation.venue_id ? parseInt(allocation.venue_id) : null,
          room_id: allocation.room_id ? parseInt(allocation.room_id) : null
        };

        return fetch(`/api/crud/event-schedule/${subeventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updateData)
        });
      });

      await Promise.all(promises);
      toast.success('Allocations saved successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving allocations:', error);
      toast.error('Failed to save allocations');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading allocation data...</p>
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
              onClick={() => navigate(`/events/${eventId}`)}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">
                {parentEvent?.event_name} - Venue Allocation
              </h2>
              <p className="text-muted">Assign venues and rooms to sub events</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={handleSaveAllocations}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  Save Allocations
                </>
              )}
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
                    {subevents.length} Sub Events
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <div className="alert alert-warning glass-effect mb-4">
            <div className="d-flex align-items-start">
              <FaExclamationTriangle className="text-warning me-2 mt-1" />
              <div>
                <h6 className="alert-heading mb-2">Room Conflicts Detected</h6>
                <p className="mb-2">The following sub events have conflicting room allocations:</p>
                <ul className="mb-0">
                  {conflicts.map((conflict, index) => {
                    const subevent1 = subevents.find(s => s.subevent_id === conflict.subevent1);
                    const subevent2 = subevents.find(s => s.subevent_id === conflict.subevent2);
                    return (
                      <li key={index}>
                        <strong>{subevent1?.subevent_name}</strong> and <strong>{subevent2?.subevent_name}</strong> 
                        are both assigned to <strong>{conflict.room_name}</strong>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Allocation Grid */}
        <div className="row g-4">
          {subevents.length === 0 ? (
            <div className="col-12">
              <div className="card glass-card">
                <div className="card-body text-center py-5">
                  <FaClipboardList className="text-muted mb-3" size={48} />
                  <h5 className="text-muted">No sub events found</h5>
                  <p className="text-muted mb-3">Create sub events first to manage their venue allocations.</p>
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => navigate(`/subevents/create?eventId=${eventId}`)}
                  >
                    Create Sub Event
                  </button>
                </div>
              </div>
            </div>
          ) : (
            subevents.map((subevent) => {
              const allocation = allocations[subevent.subevent_id] || {};
              const availableRooms = allocation.venue_id ? getAvailableRooms(allocation.venue_id) : [];
              const conflicted = isConflicted(subevent.subevent_id);
              const selectedRoom = rooms.find(r => r.room_id === parseInt(allocation.room_id));

              return (
                <div key={subevent.subevent_id} className="col-lg-6 col-xl-4">
                  <div className={`card glass-card h-100 ${conflicted ? 'border-warning' : ''}`}>
                    <div className="card-header">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="card-title mb-1 fw-bold">
                            {subevent.subevent_name}
                          </h6>
                          <small className="text-muted">#{subevent.subevent_id}</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge glass-badge ${getStatusBadgeClass(subevent.subevent_status)}`}>
                            {subevent.subevent_status}
                          </span>
                          {conflicted ? (
                            <FaTimesCircle className="text-warning" title="Room conflict" />
                          ) : allocation.venue_id && allocation.room_id ? (
                            <FaCheckCircle className="text-success" title="Allocated" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      {/* Sub Event Info */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <FaClock className="text-muted me-2" size={12} />
                          <small>{formatDateTime(subevent.subevent_start_datetime)}</small>
                        </div>
                        {subevent.capacity && (
                          <div className="d-flex align-items-center mb-2">
                            <FaUsers className="text-muted me-2" size={12} />
                            <small>Capacity: {subevent.capacity}</small>
                          </div>
                        )}
                        {subevent.subevent_description && (
                          <p className="text-muted small mb-3">
                            {subevent.subevent_description.substring(0, 80)}
                            {subevent.subevent_description.length > 80 ? '...' : ''}
                          </p>
                        )}
                      </div>

                      {/* Venue Selection */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold small">
                          <FaMapMarkerAlt className="me-1 text-primary" />
                          Venue
                        </label>
                        <select
                          className="form-select form-select-sm glass-input"
                          value={allocation.venue_id || ''}
                          onChange={(e) => handleAllocationChange(subevent.subevent_id, 'venue_id', e.target.value)}
                        >
                          <option value="">Select venue</option>
                          {venues.map(venue => (
                            <option key={venue.venue_id} value={venue.venue_id}>
                              {venue.venue_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Room Selection */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold small">Room</label>
                        <select
                          className="form-select form-select-sm glass-input"
                          value={allocation.room_id || ''}
                          onChange={(e) => handleAllocationChange(subevent.subevent_id, 'room_id', e.target.value)}
                          disabled={!allocation.venue_id}
                        >
                          <option value="">Select room</option>
                          {availableRooms.map(room => (
                            <option key={room.room_id} value={room.room_id}>
                              {room.room_name} 
                              {room.capacity && ` (${room.capacity})`}
                            </option>
                          ))}
                        </select>
                        {!allocation.venue_id && (
                          <div className="form-text small">Select venue first</div>
                        )}
                      </div>

                      {/* Room Info */}
                      {selectedRoom && (
                        <div className="mt-3 p-2 bg-light rounded glass-effect">
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="fw-semibold">Room Details:</small>
                          </div>
                          <div className="mt-1">
                            {selectedRoom.capacity && (
                              <div className="d-flex justify-content-between">
                                <small>Capacity:</small>
                                <small className="fw-semibold">{selectedRoom.capacity}</small>
                              </div>
                            )}
                            {subevent.capacity && selectedRoom.capacity && subevent.capacity > selectedRoom.capacity && (
                              <div className="text-warning small mt-1">
                                <FaExclamationTriangle className="me-1" />
                                Exceeds room capacity
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conflict Warning */}
                      {conflicted && (
                        <div className="mt-3 p-2 bg-warning bg-opacity-10 rounded">
                          <div className="d-flex align-items-center">
                            <FaExclamationTriangle className="text-warning me-2" />
                            <small className="text-warning fw-semibold">Room conflict detected</small>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {subevents.length > 0 && (
          <div className="card glass-card mt-4">
            <div className="card-body">
              <h6 className="card-title mb-3">Allocation Summary</h6>
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-primary mb-1">
                      {Object.values(allocations).filter(a => a.venue_id && a.room_id).length}
                    </div>
                    <small className="text-muted">Fully Allocated</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-warning mb-1">
                      {Object.values(allocations).filter(a => a.venue_id && !a.room_id).length}
                    </div>
                    <small className="text-muted">Venue Only</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-danger mb-1">
                      {conflicts.length}
                    </div>
                    <small className="text-muted">Conflicts</small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="h4 text-secondary mb-1">
                      {Object.values(allocations).filter(a => !a.venue_id).length}
                    </div>
                    <small className="text-muted">Unallocated</small>
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

export default SubeventAllocation;