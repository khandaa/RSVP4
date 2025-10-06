import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
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
  FaArrowLeft
} from 'react-icons/fa';
import { eventAPI, customerAPI, guestAPI } from '../../services/api';
import GuestGroupTypeahead from '../common/GuestGroupTypeahead';
import GuestFields from './GuestFields';

const GuestEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, hasRole } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    event_id: '',
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: '',
    guest_phone_country_code: '+91',
    guest_type: 'Bride\'s Family',
    guest_rsvp_status: 'Pending',
    guest_group_name: '',
    guest_address: '',
    guest_city: '',
    guest_country: '',
    guest_dietary_preferences: '',
    guest_special_requirements: '',
    guest_notes: ''
  });
  const [errors, setErrors] = useState({});

  const guestTypeOptions = ['Bride\'s Family', 'Groom\'s Family', 'Bride\'s Friends', 'Groom\'s Friends'];
  const rsvpStatusOptions = ['Pending', 'Confirmed', 'Declined', 'Tentative'];

  const fetchData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [guestResponse, eventsResponse, customersResponse] = await Promise.all([
        guestAPI.getGuest(id),
        eventAPI.getEvents(),
        customerAPI.getCustomers()
      ]);

      const guestData = guestResponse.data;
      const sanitizedData = Object.keys(formData).reduce((acc, key) => {
        acc[key] = guestData[key] === null || guestData[key] === undefined ? '' : guestData[key];
        return acc;
      }, {});

      if (guestData.guest_phone) {
        const phoneString = String(guestData.guest_phone);
        if (phoneString.startsWith('+91')) {
          sanitizedData.guest_phone_country_code = '+91';
          sanitizedData.guest_phone = phoneString.substring(3);
        } else if (phoneString.startsWith('+1')) {
          sanitizedData.guest_phone_country_code = '+1';
          sanitizedData.guest_phone = phoneString.substring(2);
        } else if (phoneString.startsWith('+44')) {
          sanitizedData.guest_phone_country_code = '+44';
          sanitizedData.guest_phone = phoneString.substring(3);
        } else if (phoneString.startsWith('+61')) {
          sanitizedData.guest_phone_country_code = '+61';
          sanitizedData.guest_phone = phoneString.substring(3);
        } else {
          sanitizedData.guest_phone = phoneString;
        }
      }

      setFormData(prev => ({ ...prev, ...sanitizedData }));
      setEvents(eventsResponse.data || eventsResponse || []);
      setCustomers(customersResponse.data || customersResponse || []);

    } catch (error) {
      console.error('Error fetching form data:', error);
      toast.error('Failed to load form data');
    } finally {
      setIsLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (formData.event_id) {
      const event = events.find(e => e.event_id === parseInt(formData.event_id));
      setSelectedEvent(event);
    } else {
      setSelectedEvent(null);
    }
  }, [formData.event_id, events]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.guest_first_name?.trim()) {
      newErrors.guest_first_name = 'First name is required';
    }
    if (!formData.guest_last_name?.trim()) {
      newErrors.guest_last_name = 'Last name is required';
    }
    if (!formData.event_id) {
      newErrors.event_id = 'Event is required';
    }
    if (formData.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email address';
    }
    if (formData.guest_phone && formData.guest_phone.replace(/\D/g, '').length !== 10) {
      newErrors.guest_phone = 'Phone number must be exactly 10 digits';
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
      const selectedEvent = events.find(event => event.event_id === parseInt(formData.event_id));
      const submitData = {
        client_id: selectedEvent?.client_id || null,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        event_id: parseInt(formData.event_id),
        subevent_id: null,
        guest_first_name: formData.guest_first_name?.trim() || '',
        guest_last_name: formData.guest_last_name?.trim() || '',
        guest_email: formData.guest_email?.trim() || null,
        guest_phone: formData.guest_phone_country_code + (formData.guest_phone?.trim() || ''),
        guest_group_name: formData.guest_group_name?.trim() || null,
        guest_status: 'Active',
        guest_address: formData.guest_address?.trim() || null,
        guest_city: formData.guest_city?.trim() || null,
        guest_country: formData.guest_country?.trim() || null,
        guest_dietary_preferences: formData.guest_dietary_preferences?.trim() || null,
        guest_special_requirements: formData.guest_special_requirements?.trim() || null,
        guest_notes: formData.guest_notes?.trim() || null,
        guest_type: formData.guest_type?.trim() || null,
        guest_rsvp_status: formData.guest_rsvp_status?.trim() || null
      };

      await guestAPI.updateGuest(id, submitData);
      toast.success('Guest updated successfully');
      navigate(`/guests/${id}`);
    } catch (error) {
      console.error('Error updating guest:', error);
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          const fieldName = err.param || err.field || 'general';
          backendErrors[fieldName] = err.msg || err.message || 'Validation error';
        });
        setErrors(backendErrors);
        toast.error('Please fix the form errors');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'Failed to update guest');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/guests/${id}`);
  };

  if (isLoadingData) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading guest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-outline-secondary glass-btn me-3"
              onClick={handleCancel}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">Edit Guest</h2>
              <p className="text-muted">Update guest details</p>
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

        <div className="row justify-content-center">
          <div className={'col-lg-10 col-xl-8'}>
            <div className="card glass-card">
              <div className="card-body p-4">
                <form id="guestForm" onSubmit={handleSubmit}>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaCalendarAlt className="me-2 text-primary" />
                        Event *
                      </label>
                      <select
                        name="event_id"
                        className={`form-select glass-input ${!formData.event_id ? 'is-invalid' : ''}`}
                        value={formData.event_id}
                        onChange={handleInputChange}
                        disabled={isLoading}
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

                    {!(hasRole('Customer Admin') || hasRole('Client Admin')) && (
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
                    )}
                  </div>

                  <div className="row g-4">
                    <div className="col-12">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            <FaUser className="me-2 text-primary" />
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="guest_first_name"
                            className={`form-control glass-input ${errors.guest_first_name ? 'is-invalid' : ''}`}
                            value={formData.guest_first_name}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter first name"
                          />
                          {errors.guest_first_name && (
                            <div className="invalid-feedback">{errors.guest_first_name}</div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            <FaUser className="me-2 text-primary" />
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="guest_last_name"
                            className={`form-control glass-input ${errors.guest_last_name ? 'is-invalid' : ''}`}
                            value={formData.guest_last_name}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter last name"
                          />
                          {errors.guest_last_name && (
                            <div className="invalid-feedback">{errors.guest_last_name}</div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            <FaEnvelope className="me-2 text-primary" />
                            Email
                          </label>
                          <input
                            type="email"
                            name="guest_email"
                            className={`form-control glass-input ${errors.guest_email ? 'is-invalid' : ''}`}
                            value={formData.guest_email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter email"
                          />
                          {errors.guest_email && (
                            <div className="invalid-feedback">{errors.guest_email}</div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            <FaPhone className="me-2 text-primary" />
                            Phone
                          </label>
                          <div className="input-group">
                            <select
                              name="guest_phone_country_code"
                              className="input-group-text glass-input"
                              value={formData.guest_phone_country_code || '+91'}
                              onChange={handleInputChange}
                              disabled={isLoading}
                            >
                              <option value="+91">+91 (IN)</option>
                              <option value="+1">+1 (US)</option>
                              <option value="+44">+44 (UK)</option>
                              <option value="+61">+61 (AU)</option>
                            </select>
                            <input
                              type="tel"
                              name="guest_phone"
                              className={`form-control glass-input ${errors.guest_phone ? 'is-invalid' : ''}`}
                              value={formData.guest_phone}
                              onChange={handleInputChange}
                              disabled={isLoading}
                              placeholder="Enter phone number"
                            />
                          </div>
                          {errors.guest_phone && (
                            <div className="invalid-feedback d-block">{errors.guest_phone}</div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            <FaTags className="me-2 text-primary" />
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
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            <FaUsers className="me-2 text-primary" />
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
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="row g-4">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">
                            <FaUsers className="me-2 text-primary" />
                            Guest Group (Optional)
                          </label>
                          <GuestGroupTypeahead
                            value={formData.guest_group_name}
                            onChange={(value) => setFormData(prev => ({ ...prev, guest_group_name: value }))}
                            clientId={selectedEvent?.client_id}
                            eventId={formData.event_id}
                            disabled={isLoading}
                            placeholder="Type to search or create new group..."
                            error={errors.guest_group_name}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12">
                      <GuestFields 
                        formData={formData} 
                        handleInputChange={handleInputChange} 
                        errors={errors} 
                      />
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

export default GuestEdit;
