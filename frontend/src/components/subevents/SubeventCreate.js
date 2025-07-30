import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaSave, 
  FaTimes, 
  FaCalendarAlt, 
  FaFileAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaTags,
  FaUsers,
  FaClipboardList,
  FaArrowLeft,
  FaLink
} from 'react-icons/fa';
import { eventAPI, subeventAPI } from '../../services/api';

const SubeventCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();
  
  // Get eventId from URL params or search params
  const eventId = params.eventId || searchParams.get('eventId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [parentEvent, setParentEvent] = useState(null);
  const [showParentDetails, setShowParentDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    event_id: eventId || '',
    subevent_name: '',
    subevent_description: '',
    subevent_status: 'Planned',
    subevent_start_datetime: '',
    subevent_end_datetime: '',
    venue_id: '',
    room_id: '',
    capacity: '',
    special_requirements: ''
  });
  const [errors, setErrors] = useState({});

  // Subevent status options
  const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

  useEffect(() => {
    fetchData();
  }, [eventId]);

  useEffect(() => {
    // Filter rooms based on selected venue
    if (formData.venue_id) {
      const venueRooms = rooms.filter(room => room.venue_id === parseInt(formData.venue_id));
      setFilteredRooms(venueRooms);
      // Clear room selection if it's not in the filtered rooms
      if (formData.room_id && !venueRooms.find(room => room.room_id === parseInt(formData.room_id))) {
        setFormData(prev => ({ ...prev, room_id: '' }));
      }
    } else {
      setFilteredRooms([]);
      setFormData(prev => ({ ...prev, room_id: '' }));
    }
  }, [formData.venue_id, rooms]);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const requests = [
        fetch('/api/venues').then(res => res.json()),
        fetch('/api/master-data/rooms').then(res => res.json())
      ];

      if (eventId) {
        requests.push(eventAPI.getEvent(eventId));
      } else {
        requests.push(eventAPI.getEvents());
      }

      const responses = await Promise.all(requests);
      
      setVenues(responses[0] || []);
      setRooms(responses[1] || []);
      
      if (eventId) {
        setParentEvent(responses[2].data);
      } else {
        setEvents(responses[2].data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.event_id) {
      newErrors.event_id = 'Event is required';
    }

    if (!formData.subevent_name.trim()) {
      newErrors.subevent_name = 'Sub event name is required';
    }

    // Date/time validation
    if (formData.subevent_start_datetime && formData.subevent_end_datetime) {
      const startDate = new Date(formData.subevent_start_datetime);
      const endDate = new Date(formData.subevent_end_datetime);
      
      if (endDate <= startDate) {
        newErrors.subevent_end_datetime = 'End date/time must be after start date/time';
      }
    }

    // Capacity validation
    if (formData.capacity && (isNaN(formData.capacity) || parseInt(formData.capacity) < 1)) {
      newErrors.capacity = 'Capacity must be a positive number';
    }

    // Venue/Room validation
    if (formData.room_id && !formData.venue_id) {
      newErrors.venue_id = 'Venue is required when room is selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        event_id: parseInt(formData.event_id),
        venue_id: formData.venue_id ? parseInt(formData.venue_id) : null,
        room_id: formData.room_id ? parseInt(formData.room_id) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        // Add parent event info for better linking
        parent_event_name: parentEvent?.event_name || null,
        parent_event_date: parentEvent?.event_start_date || null
      };

      // Use the subeventAPI to create the subevent
      const result = await subeventAPI.createSubevent(submitData);
      
      toast.success('Sub event created successfully');
      
      // If we have a parent event ID, navigate back to that event's details
      if (eventId) {
        navigate(`/events/${eventId}?tab=subevents`);
      } else {
        navigate('/subevents');
      }
    } catch (error) {
      console.error('Error creating subevent:', error);
      toast.error('Failed to create sub event: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (eventId) {
      navigate(`/subevents?eventId=${eventId}`);
    } else {
      navigate('/subevents');
    }
  };

  if (isLoadingData) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading form data...</p>
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
              onClick={handleCancel}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">Create New Sub Event</h2>
              <p className="text-muted">
                {eventId && parentEvent 
                  ? `Add a sub event to ${parentEvent.event_name}`
                  : 'Create a new sub event'
                }
              </p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              type="button"
              className="btn btn-outline-secondary glass-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <FaTimes className="me-2" />
              Cancel
            </button>
            <button 
              type="submit"
              form="subeventForm"
              className="btn btn-primary glass-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating...
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  Create Sub Event
                </>
              )}
            </button>
          </div>
        </div>

        {/* Parent Event Info (if applicable) */}
        {eventId && parentEvent && (
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
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="card glass-card">
              <div className="card-body p-4">
                <form id="subeventForm" onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* Event Selection (if not pre-selected) */}
                    {!eventId && (
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          <FaCalendarAlt className="me-2 text-primary" />
                          <FaLink className="me-1" /> Parent Event *
                        </label>
                        <select
                          name="event_id"
                          className={`form-select glass-input ${errors.event_id ? 'is-invalid' : ''}`}
                          value={formData.event_id}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (e.target.value) {
                              // Fetch parent event details when selected
                              const selectedEventId = e.target.value;
                              eventAPI.getEvent(selectedEventId)
                                .then(response => {
                                  setParentEvent(response.data);
                                  setShowParentDetails(true);
                                })
                                .catch(error => {
                                  console.error('Error fetching event details:', error);
                                });
                            } else {
                              setShowParentDetails(false);
                              setParentEvent(null);
                            }
                          }}
                          disabled={isLoading}
                        >
                          <option value="">Select a parent event</option>
                          {events.map(event => (
                            <option key={event.event_id} value={event.event_id}>
                              {event.event_name} ({event.client_name || 'No client'})
                            </option>
                          ))}
                        </select>
                        {errors.event_id && (
                          <div className="invalid-feedback">{errors.event_id}</div>
                        )}
                      </div>
                    )}
                    
                    {/* Display parent event details */}
                    {((eventId && parentEvent) || showParentDetails) && (
                      <div className="col-12">
                        <div className="alert alert-info d-flex align-items-start mb-3">
                          <div>
                            <h6 className="mb-1"><strong><FaLink className="me-2" />Parent Event:</strong> {parentEvent?.event_name}</h6>
                            <div className="row g-2 mt-1">
                              <div className="col-md-6">
                                <small className="d-block"><strong>Status:</strong> {parentEvent?.event_status}</small>
                                <small className="d-block"><strong>Type:</strong> {parentEvent?.event_type}</small>
                              </div>
                              <div className="col-md-6">
                                <small className="d-block"><strong>Starts:</strong> {parentEvent?.event_start_date ? new Date(parentEvent.event_start_date).toLocaleDateString() : 'N/A'}</small>
                                <small className="d-block"><strong>Ends:</strong> {parentEvent?.event_end_date ? new Date(parentEvent.event_end_date).toLocaleDateString() : 'N/A'}</small>
                              </div>
                            </div>
                            <small className="text-muted mt-2 d-block">
                              <em>This sub-event will be linked to this parent event.</em>
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub Event Name */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <FaClipboardList className="me-2 text-primary" />
                        Sub Event Name *
                      </label>
                      <input
                        type="text"
                        name="subevent_name"
                        className={`form-control glass-input ${errors.subevent_name ? 'is-invalid' : ''}`}
                        placeholder="Enter sub event name"
                        value={formData.subevent_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.subevent_name && (
                        <div className="invalid-feedback">{errors.subevent_name}</div>
                      )}
                    </div>

                    {/* Sub Event Description */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <FaFileAlt className="me-2 text-primary" />
                        Description
                      </label>
                      <textarea
                        name="subevent_description"
                        className="form-control glass-input"
                        placeholder="Enter sub event description"
                        rows="3"
                        value={formData.subevent_description}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaTags className="me-2 text-primary" />
                        Status
                      </label>
                      <select
                        name="subevent_status"
                        className="form-select glass-input"
                        value={formData.subevent_status}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* Capacity */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaUsers className="me-2 text-primary" />
                        Capacity
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        className={`form-control glass-input ${errors.capacity ? 'is-invalid' : ''}`}
                        placeholder="Enter capacity"
                        min="1"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.capacity && (
                        <div className="invalid-feedback">{errors.capacity}</div>
                      )}
                    </div>

                    {/* Start DateTime */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaClock className="me-2 text-primary" />
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="subevent_start_datetime"
                        className={`form-control glass-input ${errors.subevent_start_datetime ? 'is-invalid' : ''}`}
                        value={formData.subevent_start_datetime}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.subevent_start_datetime && (
                        <div className="invalid-feedback">{errors.subevent_start_datetime}</div>
                      )}
                    </div>

                    {/* End DateTime */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaClock className="me-2 text-primary" />
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="subevent_end_datetime"
                        className={`form-control glass-input ${errors.subevent_end_datetime ? 'is-invalid' : ''}`}
                        value={formData.subevent_end_datetime}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        min={formData.subevent_start_datetime || undefined}
                      />
                      {errors.subevent_end_datetime && (
                        <div className="invalid-feedback">{errors.subevent_end_datetime}</div>
                      )}
                    </div>
                      </label>
                      <select
                        name="room_id"
                        className="form-select glass-input"
                        value={formData.room_id}
                        onChange={handleInputChange}
                        disabled={isLoading || !formData.venue_id}
                      >
                        <option value="">Select a room</option>
                        {filteredRooms.map(room => (
                          <option key={room.room_id} value={room.room_id}>
                            {room.room_name} (Capacity: {room.capacity || 'N/A'})
                          </option>
                        ))}
                      </select>
                      {!formData.venue_id && (
                        <div className="form-text text-muted">
                          Select a venue first to see available rooms
                        </div>
                      )}
                    </div>

                    {/* Special Requirements */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Special Requirements
                      </label>
                      <textarea
                        name="special_requirements"
                        className="form-control glass-input"
                        placeholder="Enter any special requirements or notes"
                        rows="3"
                        value={formData.special_requirements}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Form Info */}
                  <div className="mt-4 p-3 bg-light rounded glass-effect">
                    <div className="d-flex align-items-start">
                      <div className="flex-shrink-0">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', fontSize: '12px'}}>
                          i
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">Sub Event Setup</h6>
                        <small className="text-muted">
                          • Sub events help organize your main event into smaller parts<br/>
                          • Venue and room allocation helps manage space requirements<br/>
                          • Capacity limits help control attendance for each sub event<br/>
                          • Date/time scheduling ensures proper event flow
                        </small>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubeventCreate;