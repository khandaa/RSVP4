import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaSave, 
  FaTimes, 
  FaUser, 
  FaEnvelope, 
  FaPhone,
  FaBuilding,
  FaCalendarAlt,
  FaTags,
  FaUsers,
  FaArrowLeft,
  FaInfoCircle
} from 'react-icons/fa';

const GuestCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [guestGroups, setGuestGroups] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    event_id: eventId || '',
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: '',
    guest_organization: '',
    guest_designation: '',
    guest_type: 'Individual',
    guest_rsvp_status: 'Pending',
    guest_group_id: '',
    guest_address: '',
    guest_city: '',
    guest_state: '',
    guest_country: '',
    guest_dietary_preferences: '',
    guest_special_requirements: '',
    guest_notes: ''
  });
  const [errors, setErrors] = useState({});

  // Guest type and RSVP status options
  const guestTypeOptions = ['Individual', 'Family', 'Corporate', 'VIP', 'Media'];
  const rsvpStatusOptions = ['Pending', 'Confirmed', 'Declined', 'Tentative'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      const [eventsResponse, customersResponse, groupsResponse] = await Promise.all([
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        fetch('/api/customers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        fetch('/api/crud/guest-groups', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()).catch(() => [])
      ]);
      
      setEvents(eventsResponse.data || eventsResponse || []);
      setCustomers(customersResponse.data || customersResponse || []);
      setGuestGroups(groupsResponse || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
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
    if (!formData.guest_first_name.trim()) {
      newErrors.guest_first_name = 'First name is required';
    }

    if (!formData.guest_last_name.trim()) {
      newErrors.guest_last_name = 'Last name is required';
    }

    if (!formData.event_id) {
      newErrors.event_id = 'Event is required';
    }

    // Email validation
    if (formData.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email address';
    }

    // Phone validation (basic)
    if (formData.guest_phone && formData.guest_phone.length < 10) {
      newErrors.guest_phone = 'Please enter a valid phone number';
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
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        event_id: parseInt(formData.event_id),
        guest_group_id: formData.guest_group_id ? parseInt(formData.guest_group_id) : null
      };

      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Failed to create guest');
      }

      const result = await response.json();
      toast.success('Guest created successfully');
      
      if (eventId) {
        navigate(`/guests?eventId=${eventId}`);
      } else {
        navigate('/guests');
      }
    } catch (error) {
      console.error('Error creating guest:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
        toast.error('Please fix the form errors');
      } else {
        toast.error('Failed to create guest');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (eventId) {
      navigate(`/guests?eventId=${eventId}`);
    } else {
      navigate('/guests');
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
              <h2 className="text-dark fw-bold mb-0">Add New Guest</h2>
              <p className="text-muted">
                {eventId ? 'Add a guest to the selected event' : 'Add a new guest to the system'}
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
              form="guestForm"
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
                  Create Guest
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <div className="card glass-card">
              <div className="card-body p-4">
                <form id="guestForm" onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* Basic Information Section */}
                    <div className="col-12">
                      <h5 className="text-primary mb-3">
                        <FaUser className="me-2" />
                        Basic Information
                      </h5>
                    </div>

                    {/* Event Selection */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaCalendarAlt className="me-2 text-primary" />
                        Event *
                      </label>
                      <select
                        name="event_id"
                        className={`form-select glass-input ${errors.event_id ? 'is-invalid' : ''}`}
                        value={formData.event_id}
                        onChange={handleInputChange}
                        disabled={isLoading || eventId}
                      >
                        <option value="">Select an event</option>
                        {events.map(event => (
                          <option key={event.event_id} value={event.event_id}>
                            {event.event_name} ({event.client_name})
                          </option>
                        ))}
                      </select>
                      {errors.event_id && (
                        <div className="invalid-feedback">{errors.event_id}</div>
                      )}
                    </div>

                    {/* Customer Selection */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaBuilding className="me-2 text-primary" />
                        Customer
                      </label>
                      <select
                        name="customer_id"
                        className="form-select glass-input"
                        value={formData.customer_id}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">Select a customer</option>
                        {customers.map(customer => (
                          <option key={customer.customer_id} value={customer.customer_id}>
                            {customer.customer_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* First Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="guest_first_name"
                        className={`form-control glass-input ${errors.guest_first_name ? 'is-invalid' : ''}`}
                        placeholder="Enter first name"
                        value={formData.guest_first_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.guest_first_name && (
                        <div className="invalid-feedback">{errors.guest_first_name}</div>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="guest_last_name"
                        className={`form-control glass-input ${errors.guest_last_name ? 'is-invalid' : ''}`}
                        placeholder="Enter last name"
                        value={formData.guest_last_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.guest_last_name && (
                        <div className="invalid-feedback">{errors.guest_last_name}</div>
                      )}
                    </div>

                    {/* Contact Information Section */}
                    <div className="col-12">
                      <h5 className="text-primary mb-3 mt-4">
                        <FaEnvelope className="me-2" />
                        Contact Information
                      </h5>
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaEnvelope className="me-2 text-primary" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="guest_email"
                        className={`form-control glass-input ${errors.guest_email ? 'is-invalid' : ''}`}
                        placeholder="Enter email address"
                        value={formData.guest_email}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.guest_email && (
                        <div className="invalid-feedback">{errors.guest_email}</div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaPhone className="me-2 text-primary" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="guest_phone"
                        className={`form-control glass-input ${errors.guest_phone ? 'is-invalid' : ''}`}
                        placeholder="Enter phone number"
                        value={formData.guest_phone}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.guest_phone && (
                        <div className="invalid-feedback">{errors.guest_phone}</div>
                      )}
                    </div>

                    {/* Organization */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaBuilding className="me-2 text-primary" />
                        Organization
                      </label>
                      <input
                        type="text"
                        name="guest_organization"
                        className="form-control glass-input"
                        placeholder="Enter organization name"
                        value={formData.guest_organization}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Designation */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Designation
                      </label>
                      <input
                        type="text"
                        name="guest_designation"
                        className="form-control glass-input"
                        placeholder="Enter designation/title"
                        value={formData.guest_designation}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Classification Section */}
                    <div className="col-12">
                      <h5 className="text-primary mb-3 mt-4">
                        <FaTags className="me-2" />
                        Classification
                      </h5>
                    </div>

                    {/* Guest Type */}
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Guest Type
                      </label>
                      <select
                        name="guest_type"
                        className="form-select glass-input"
                        value={formData.guest_type}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        {guestTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* RSVP Status */}
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        RSVP Status
                      </label>
                      <select
                        name="guest_rsvp_status"
                        className="form-select glass-input"
                        value={formData.guest_rsvp_status}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        {rsvpStatusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* Guest Group */}
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        <FaUsers className="me-2 text-primary" />
                        Guest Group
                      </label>
                      <select
                        name="guest_group_id"
                        className="form-select glass-input"
                        value={formData.guest_group_id}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="">No group</option>
                        {guestGroups.map(group => (
                          <option key={group.group_id} value={group.group_id}>
                            {group.group_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Address Section */}
                    <div className="col-12">
                      <h5 className="text-primary mb-3 mt-4">
                        Address Information
                      </h5>
                    </div>

                    {/* Address */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Address
                      </label>
                      <textarea
                        name="guest_address"
                        className="form-control glass-input"
                        placeholder="Enter full address"
                        rows="2"
                        value={formData.guest_address}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* City, State, Country */}
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        City
                      </label>
                      <input
                        type="text"
                        name="guest_city"
                        className="form-control glass-input"
                        placeholder="Enter city"
                        value={formData.guest_city}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        State/Province
                      </label>
                      <input
                        type="text"
                        name="guest_state"
                        className="form-control glass-input"
                        placeholder="Enter state/province"
                        value={formData.guest_state}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Country
                      </label>
                      <input
                        type="text"
                        name="guest_country"
                        className="form-control glass-input"
                        placeholder="Enter country"
                        value={formData.guest_country}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Additional Information Section */}
                    <div className="col-12">
                      <h5 className="text-primary mb-3 mt-4">
                        Additional Information
                      </h5>
                    </div>

                    {/* Dietary Preferences */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Dietary Preferences
                      </label>
                      <textarea
                        name="guest_dietary_preferences"
                        className="form-control glass-input"
                        placeholder="Enter dietary preferences or restrictions"
                        rows="3"
                        value={formData.guest_dietary_preferences}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Special Requirements */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Special Requirements
                      </label>
                      <textarea
                        name="guest_special_requirements"
                        className="form-control glass-input"
                        placeholder="Enter any special requirements or accommodations"
                        rows="3"
                        value={formData.guest_special_requirements}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Internal Notes
                      </label>
                      <textarea
                        name="guest_notes"
                        className="form-control glass-input"
                        placeholder="Enter internal notes about the guest"
                        rows="3"
                        value={formData.guest_notes}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Form Info */}
                  <div className="mt-4 p-3 bg-light rounded glass-effect">
                    <div className="d-flex align-items-start">
                      <div className="flex-shrink-0">
                        <FaInfoCircle className="text-primary" />
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">Guest Information</h6>
                        <small className="text-muted">
                          • First name, last name, and event are required fields<br/>
                          • Email and phone help with communication and RSVP tracking<br/>
                          • Guest type helps categorize attendees for reporting<br/>
                          • RSVP status can be updated later when responses are received
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

export default GuestCreate;