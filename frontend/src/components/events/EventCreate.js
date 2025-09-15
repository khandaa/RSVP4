import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaSave, 
  FaTimes, 
  FaCalendarAlt, 
  FaUser, 
  FaFileAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaTags
} from 'react-icons/fa';
import { eventAPI, clientAPI } from '../../services/api';

const EventCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [clients, setClients] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    event_name: '',
    event_description: '',
    event_status: 'Planned',
    event_type_id: '',
    event_start_date: '',
    event_end_date: ''
  });
  const [errors, setErrors] = useState({});

  // Event status options
  const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];

  useEffect(() => {
    fetchData();
    
    // If coming from client detail, pre-select the client
    if (location.state?.clientId) {
      setFormData(prev => ({ ...prev, client_id: location.state.clientId.toString() }));
    }
  }, []);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [clientsResponse, eventTypesResponse] = await Promise.all([
        clientAPI.getClients(),
        fetch('/api/master-data/event-types').then(res => res.json())
      ]);
      
      setClients(clientsResponse.data || []);
      if (Array.isArray(eventTypesResponse)) {
        setEventTypes(eventTypesResponse);
      } else if (eventTypesResponse && Array.isArray(eventTypesResponse.data)) {
        setEventTypes(eventTypesResponse.data);
      } else {
        setEventTypes([]);
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
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }

    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }

    // Date validation
    if (formData.event_start_date && formData.event_end_date) {
      const startDate = new Date(formData.event_start_date);
      const endDate = new Date(formData.event_end_date);
      
      if (endDate < startDate) {
        newErrors.event_end_date = 'End date cannot be before start date';
      }
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
        client_id: parseInt(formData.client_id),
        event_type_id: formData.event_type_id ? parseInt(formData.event_type_id) : null
      };

      const response = await eventAPI.createEvent(submitData);
      toast.success('Event created successfully');
      navigate(`/events/${response.data.event_id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
        toast.error('Please fix the form errors');
      } else {
        toast.error(error.response?.data?.error || 'Failed to create event');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
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
          <div>
            <h2 className="text-dark fw-bold mb-0">Create New Event</h2>
            <p className="text-muted">Set up a new event for your client</p>
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
              form="eventForm"
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
                  Create Event
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="card glass-card">
              <div className="card-body p-4">
                <form id="eventForm" onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* Client Selection */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <FaUser className="me-2 text-primary" />
                        Client *
                      </label>
                      <select
                        name="client_id"
                        className={`form-select glass-input ${errors.client_id ? 'is-invalid' : ''}`}
                        value={formData.client_id}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">Select a client</option>
                        {clients.map(client => (
                          <option key={client.client_id} value={client.client_id}>
                            {client.client_name} ({client.customer_name})
                          </option>
                        ))}
                      </select>
                      {errors.client_id && (
                        <div className="invalid-feedback">{errors.client_id}</div>
                      )}
                    </div>

                    {/* Event Name */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <FaCalendarAlt className="me-2 text-primary" />
                        Event Name *
                      </label>
                      <input
                        type="text"
                        name="event_name"
                        className={`form-control glass-input ${errors.event_name ? 'is-invalid' : ''}`}
                        placeholder="Enter event name"
                        value={formData.event_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.event_name && (
                        <div className="invalid-feedback">{errors.event_name}</div>
                      )}
                    </div>

                    {/* Event Description */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <FaFileAlt className="me-2 text-primary" />
                        Description
                      </label>
                      <textarea
                        name="event_description"
                        className="form-control glass-input"
                        placeholder="Enter event description"
                        rows="4"
                        value={formData.event_description}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Status and Type */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Status
                      </label>
                      <select
                        name="event_status"
                        className="form-select glass-input"
                        value={formData.event_status}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaTags className="me-2 text-primary" />
                        Event Type
                      </label>
                      <select
                        name="event_type_id"
                        className="form-select glass-input"
                        value={formData.event_type_id}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">Select event type</option>
                        {eventTypes.map(type => (
                          <option key={type.event_type_id} value={type.event_type_id}>
                            {type.event_type_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaClock className="me-2 text-primary" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="event_start_date"
                        className={`form-control glass-input ${errors.event_start_date ? 'is-invalid' : ''}`}
                        value={formData.event_start_date}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.event_start_date && (
                        <div className="invalid-feedback">{errors.event_start_date}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaClock className="me-2 text-primary" />
                        End Date
                      </label>
                      <input
                        type="date"
                        name="event_end_date"
                        className={`form-control glass-input ${errors.event_end_date ? 'is-invalid' : ''}`}
                        value={formData.event_end_date}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        min={formData.event_start_date || undefined}
                      />
                      {errors.event_end_date && (
                        <div className="invalid-feedback">{errors.event_end_date}</div>
                      )}
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
                        <h6 className="mb-1">Event Setup</h6>
                        <small className="text-muted">
                          • Select the client who is organizing this event<br/>
                          • Event name should be descriptive and unique<br/>
                          • You can add more details after creating the event<br/>
                          • Event type helps in categorization and reporting
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

export default EventCreate;