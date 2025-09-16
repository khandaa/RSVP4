import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaSave, 
  FaTimes, 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaUser, 
  FaFileAlt, 
  FaClock, 
  FaTags,
  FaExclamationTriangle
} from 'react-icons/fa';
import { eventAPI, clientAPI } from '../../services/api';

const EventEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [statusHistory, setStatusHistory] = useState([]);

  // Event status options with descriptions
  const statusOptions = [
    { value: 'Planned', label: 'Planned', color: 'primary', description: 'Event is being planned' },
    { value: 'In Progress', label: 'In Progress', color: 'warning', description: 'Event is currently happening' },
    { value: 'Completed', label: 'Completed', color: 'success', description: 'Event has finished successfully' },
    { value: 'Cancelled', label: 'Cancelled', color: 'danger', description: 'Event has been cancelled' },
    { value: 'Postponed', label: 'Postponed', color: 'secondary', description: 'Event has been postponed' }
  ];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [eventResponse, clientsResponse, eventTypesResponse] = await Promise.all([
        eventAPI.getEvent(id),
        clientAPI.getClients(),
        fetch('/api/master-data/event-types')
          .then(res => res.json())
          .catch(error => {
            console.error('Error fetching event types:', error);
            return []; // Return empty array as fallback
          })
      ]);
      
      const eventData = {
        client_id: eventResponse.data.client_id?.toString() || '',
        event_name: eventResponse.data.event_name || '',
        event_description: eventResponse.data.event_description || '',
        event_status: eventResponse.data.event_status || 'Planned',
        event_type_id: eventResponse.data.event_type_id?.toString() || '',
        event_start_date: eventResponse.data.event_start_date ? 
          new Date(eventResponse.data.event_start_date).toISOString().split('T')[0] : '',
        event_end_date: eventResponse.data.event_end_date ? 
          new Date(eventResponse.data.event_end_date).toISOString().split('T')[0] : ''
      };
      
      setFormData(eventData);
      setOriginalData(eventData);
      setClients(clientsResponse.data || []);
      // Ensure eventTypes is always an array
      const types = Array.isArray(eventTypesResponse) ? eventTypesResponse : 
                   (eventTypesResponse?.data ? eventTypesResponse.data : []);
      setEventTypes(types);

      // Create mock status history (in real app this would come from API)
      setStatusHistory([
        {
          status: eventResponse.data.event_status,
          changed_at: eventResponse.data.updated_at || eventResponse.data.created_at,
          changed_by: 'System'
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to fetch event details');
      navigate('/events');
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

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    const oldStatus = formData.event_status;
    
    setFormData(prev => ({
      ...prev,
      event_status: newStatus
    }));

    // Add to status history if status actually changed
    if (newStatus !== oldStatus) {
      setStatusHistory(prev => [
        {
          status: newStatus,
          changed_at: new Date().toISOString(),
          changed_by: 'Current User'
        },
        ...prev
      ]);
    }

    // Show warnings for certain status changes
    if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
      toast.warning('Cancelling this event will affect all related bookings and notifications.');
    } else if (newStatus === 'Completed' && oldStatus !== 'Completed') {
      toast.info('Marking event as completed will finalize all associated data.');
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

    // Status validation
    if (formData.event_status === 'Completed' && !formData.event_end_date) {
      newErrors.event_end_date = 'End date is required when marking event as completed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = () => {
    return Object.keys(formData).some(key => formData[key] !== originalData[key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    if (!hasChanges()) {
      toast.info('No changes to save');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        client_id: parseInt(formData.client_id),
        event_type_id: formData.event_type_id ? parseInt(formData.event_type_id) : null
      };

      await eventAPI.updateEvent(id, submitData);
      toast.success('Event updated successfully');
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
        toast.error('Please fix the form errors');
      } else {
        toast.error(error.response?.data?.error || 'Failed to update event');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/events/${id}`);
      }
    } else {
      navigate(`/events/${id}`);
    }
  };

  if (isLoadingData) {
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

  const currentStatus = statusOptions.find(s => s.value === formData.event_status);

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={() => navigate(`/events/${id}`)}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">Edit Event</h2>
              <p className="text-muted mb-0">Update event information and track status</p>
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
              form="eventEditForm"
              className="btn btn-primary glass-btn-primary"
              disabled={isLoading || !hasChanges()}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Form */}
          <div className="col-lg-8">
            <div className="card glass-card">
              <div className="card-body p-4">
                <form id="eventEditForm" onSubmit={handleSubmit}>
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
                        Status *
                      </label>
                      <select
                        name="event_status"
                        className={`form-select glass-input ${errors.event_status ? 'is-invalid' : ''}`}
                        value={formData.event_status}
                        onChange={handleStatusChange}
                        disabled={isLoading}
                      >
                        {statusOptions.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {currentStatus && (
                        <div className="form-text">
                          {currentStatus.description}
                        </div>
                      )}
                      {errors.event_status && (
                        <div className="invalid-feedback">{errors.event_status}</div>
                      )}
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

                  {/* Change Summary */}
                  {hasChanges() && (
                    <div className="mt-4 p-3 bg-warning bg-opacity-10 rounded glass-effect">
                      <div className="d-flex align-items-start">
                        <FaExclamationTriangle className="text-warning me-2 mt-1" />
                        <div>
                          <h6 className="mb-1 text-warning">Unsaved Changes</h6>
                          <small className="text-muted">
                            You have made changes to this event. Don't forget to save your changes.
                          </small>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Status Tracking Sidebar */}
          <div className="col-lg-4">
            {/* Current Status */}
            <div className="card glass-card mb-4">
              <div className="card-header">
                <h6 className="card-title mb-0">Current Status</h6>
              </div>
              <div className="card-body text-center">
                <span className={`badge glass-badge fs-5 bg-${currentStatus?.color}`}>
                  {currentStatus?.label}
                </span>
                <p className="text-muted mt-2 mb-0">
                  {currentStatus?.description}
                </p>
              </div>
            </div>

            {/* Status History */}
            <div className="card glass-card">
              <div className="card-header">
                <h6 className="card-title mb-0">Status History</h6>
              </div>
              <div className="card-body">
                {statusHistory.length > 0 ? (
                  <div className="timeline">
                    {statusHistory.map((entry, index) => {
                      const statusOption = statusOptions.find(s => s.value === entry.status);
                      return (
                        <div key={index} className="timeline-item d-flex mb-3">
                          <div className="timeline-marker">
                            <div className={`bg-${statusOption?.color} text-white rounded-circle d-flex align-items-center justify-content-center`} 
                                 style={{width: '32px', height: '32px', fontSize: '12px'}}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="timeline-content ms-3 flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{entry.status}</h6>
                                <small className="text-muted">
                                  by {entry.changed_by}
                                </small>
                              </div>
                              <small className="text-muted">
                                {new Date(entry.changed_at).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">No status changes recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventEdit;