import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  FaArrowLeft,
  FaInfoCircle
} from 'react-icons/fa';

const GuestCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const { currentUser, hasRole } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [guestGroups, setGuestGroups] = useState([]);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'table'
  const [tableGuests, setTableGuests] = useState([
    {
      id: 1,
      guest_first_name: '',
      guest_last_name: '',
      guest_email: '',
      guest_phone: '',
      guest_type: 'Bride\'s Family',
      guest_rsvp_status: 'Pending',
      guest_address: '',
      guest_city: '',
      guest_country: '',
      guest_dietary_preferences: '',
      guest_special_requirements: '',
      guest_notes: ''
    }
  ]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    event_id: eventId || '',
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: '',
    guest_type: 'Bride\'s Family',
    guest_rsvp_status: 'Pending',
    guest_group_id: '',
    guest_address: '',
    guest_city: '',
    guest_country: '',
    guest_dietary_preferences: '',
    guest_special_requirements: '',
    guest_notes: ''
  });
  const [errors, setErrors] = useState({});

  // Guest type and RSVP status options
  const guestTypeOptions = ['Bride\'s Family', 'Groom\'s Family', 'Bride\'s Friends', 'Groom\'s Friends'];
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
      
      // Auto-select customer for Customer Admin or Client Admin users
      if (currentUser && (hasRole('Customer Admin') || hasRole('Client Admin'))) {
        // Find customer by matching current user's email
        const userCustomer = (customersResponse.data || customersResponse || []).find(
          customer => customer.customer_email === currentUser.email
        );
        
        if (userCustomer) {
          setFormData(prev => ({
            ...prev,
            customer_id: userCustomer.customer_id.toString()
          }));
        }
      }
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
    
    if (viewMode === 'form') {
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
    } else {
      // Handle table mode submission
      handleTableSubmit();
    }
  };

  const handleTableSubmit = async () => {
    // Validate table data
    const validGuests = tableGuests.filter(guest => 
      guest.guest_first_name.trim() && guest.guest_last_name.trim()
    );

    if (validGuests.length === 0) {
      toast.error('Please add at least one guest with first and last name');
      return;
    }

    if (!formData.event_id) {
      toast.error('Please select an event');
      return;
    }

    setIsLoading(true);

    try {
      const guestsToSubmit = validGuests.map(guest => ({
        ...guest,
        customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
        event_id: parseInt(formData.event_id),
        guest_group_id: formData.guest_group_id ? parseInt(formData.guest_group_id) : null
      }));

      // Submit all guests
      const promises = guestsToSubmit.map(guestData => 
        fetch('/api/guests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(guestData)
        })
      );

      const responses = await Promise.all(promises);
      const failedCount = responses.filter(response => !response.ok).length;
      
      if (failedCount === 0) {
        toast.success(`Successfully created ${validGuests.length} guests`);
      } else {
        toast.warning(`Created ${validGuests.length - failedCount} guests, ${failedCount} failed`);
      }
      
      if (eventId) {
        navigate(`/guests?eventId=${eventId}`);
      } else {
        navigate('/guests');
      }
    } catch (error) {
      console.error('Error creating guests:', error);
      toast.error('Failed to create guests');
    } finally {
      setIsLoading(false);
    }
  };

  // Table mode handlers
  const handleTableInputChange = (index, field, value) => {
    const updatedGuests = [...tableGuests];
    updatedGuests[index][field] = value;
    setTableGuests(updatedGuests);
  };

  const addTableRow = () => {
    const newGuest = {
      id: Date.now(),
      guest_first_name: '',
      guest_last_name: '',
      guest_email: '',
      guest_phone: '',
      guest_type: 'Bride\'s Family',
      guest_rsvp_status: 'Pending',
      guest_address: '',
      guest_city: '',
      guest_country: '',
      guest_dietary_preferences: '',
      guest_special_requirements: '',
      guest_notes: ''
    };
    setTableGuests([...tableGuests, newGuest]);
  };

  const removeTableRow = (index) => {
    if (tableGuests.length > 1) {
      const updatedGuests = tableGuests.filter((_, i) => i !== index);
      setTableGuests(updatedGuests);
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
              <h2 className="text-dark fw-bold mb-0">Add New Guest{viewMode === 'table' ? 's' : ''}</h2>
              <p className="text-muted">
                {viewMode === 'form' 
                  ? (eventId ? 'Add a guest to the selected event' : 'Add a new guest to the system')
                  : 'Add multiple guests using table mode'
                }
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Mode Toggle */}
            <div className="d-flex align-items-center">
              <span className="me-2 text-muted">Form</span>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="modeToggle"
                  checked={viewMode === 'table'}
                  onChange={(e) => setViewMode(e.target.checked ? 'table' : 'form')}
                />
              </div>
              <span className="ms-2 text-muted">Table</span>
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
                    {viewMode === 'table' ? 'Create All Guests' : 'Create Guest'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="row justify-content-center">
          <div className={viewMode === 'table' ? 'col-12' : 'col-lg-10 col-xl-8'}>
            <div className="card glass-card">
              <div className="card-body p-4">
                <form id="guestForm" onSubmit={viewMode === 'form' ? handleSubmit : handleTableSubmit}>
                  {/* Event and Customer Selection */}
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

                  {viewMode === 'form' ? (
                    <div className="row g-4">
                      {/* Guest Form Fields */}
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
                            <input
                              type="tel"
                              name="guest_phone"
                              className={`form-control glass-input ${errors.guest_phone ? 'is-invalid' : ''}`}
                              value={formData.guest_phone}
                              onChange={handleInputChange}
                              disabled={isLoading}
                              placeholder="Enter phone number"
                            />
                            {errors.guest_phone && (
                              <div className="invalid-feedback">{errors.guest_phone}</div>
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

                      {/* Guest Group Selection */}
                      <div className="col-12">
                        <div className="row g-4">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">
                              <FaUsers className="me-2 text-primary" />
                              Guest Group (Optional)
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
                                <option key={group.guest_group_id} value={group.guest_group_id}>
                                  {group.guest_group_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-primary mb-0">
                          <FaUsers className="me-2" />
                          Guest Details
                        </h5>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm glass-btn"
                          onClick={addTableRow}
                          disabled={isLoading}
                        >
                          + Add Row
                        </button>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th style={{minWidth: '120px'}}>First Name *</th>
                              <th style={{minWidth: '120px'}}>Last Name *</th>
                              <th style={{minWidth: '180px'}}>Email</th>
                              <th style={{minWidth: '130px'}}>Phone</th>
                              <th style={{minWidth: '140px'}}>Guest Type</th>
                              <th style={{minWidth: '120px'}}>RSVP Status</th>
                              <th style={{minWidth: '150px'}}>Address</th>
                              <th style={{minWidth: '100px'}}>City</th>
                              <th style={{minWidth: '100px'}}>Country</th>
                              <th style={{minWidth: '150px'}}>Dietary Preferences</th>
                              <th style={{minWidth: '150px'}}>Special Requirements</th>
                              <th style={{minWidth: '150px'}}>Notes</th>
                              <th style={{width: '50px'}}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableGuests.map((guest, index) => (
                              <tr key={guest.id}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={guest.guest_first_name}
                                    onChange={(e) => handleTableInputChange(index, 'guest_first_name', e.target.value)}
                                    placeholder="First name"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={guest.guest_last_name}
                                    onChange={(e) => handleTableInputChange(index, 'guest_last_name', e.target.value)}
                                    placeholder="Last name"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="email"
                                    className="form-control form-control-sm"
                                    value={guest.guest_email}
                                    onChange={(e) => handleTableInputChange(index, 'guest_email', e.target.value)}
                                    placeholder="Email"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="tel"
                                    className="form-control form-control-sm"
                                    value={guest.guest_phone}
                                    onChange={(e) => handleTableInputChange(index, 'guest_phone', e.target.value)}
                                    placeholder="Phone"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={guest.guest_type}
                                    onChange={(e) => handleTableInputChange(index, 'guest_type', e.target.value)}
                                    disabled={isLoading}
                                  >
                                    {guestTypeOptions.map(type => (
                                      <option key={type} value={type}>{type}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={guest.guest_rsvp_status}
                                    onChange={(e) => handleTableInputChange(index, 'guest_rsvp_status', e.target.value)}
                                    disabled={isLoading}
                                  >
                                    {rsvpStatusOptions.map(status => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <textarea
                                    className="form-control form-control-sm"
                                    value={guest.guest_address}
                                    onChange={(e) => handleTableInputChange(index, 'guest_address', e.target.value)}
                                    placeholder="Address"
                                    rows="1"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={guest.guest_city}
                                    onChange={(e) => handleTableInputChange(index, 'guest_city', e.target.value)}
                                    placeholder="City"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={guest.guest_country}
                                    onChange={(e) => handleTableInputChange(index, 'guest_country', e.target.value)}
                                    placeholder="Country"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <textarea
                                    className="form-control form-control-sm"
                                    value={guest.guest_dietary_preferences}
                                    onChange={(e) => handleTableInputChange(index, 'guest_dietary_preferences', e.target.value)}
                                    placeholder="Dietary preferences"
                                    rows="1"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <textarea
                                    className="form-control form-control-sm"
                                    value={guest.guest_special_requirements}
                                    onChange={(e) => handleTableInputChange(index, 'guest_special_requirements', e.target.value)}
                                    placeholder="Special requirements"
                                    rows="1"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <textarea
                                    className="form-control form-control-sm"
                                    value={guest.guest_notes}
                                    onChange={(e) => handleTableInputChange(index, 'guest_notes', e.target.value)}
                                    placeholder="Notes"
                                    rows="1"
                                    disabled={isLoading}
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeTableRow(index)}
                                    disabled={isLoading || tableGuests.length === 1}
                                    title="Remove row"
                                  >
                                    <FaTimes />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Info */}
                      <div className="mt-3 p-3 bg-light rounded glass-effect">
                        <div className="d-flex align-items-start">
                          <div className="flex-shrink-0">
                            <FaInfoCircle className="text-primary" />
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <h6 className="mb-1">Table Mode Instructions</h6>
                            <small className="text-muted">
                              • First name and last name are required for each guest<br/>
                              • Click "Add Row" to add more guests<br/>
                              • Only rows with first and last names will be saved<br/>
                              • All guests will be assigned to the selected event
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {/* Table View */}
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="text-primary mb-0">
                            <FaUsers className="me-2" />
                            Guest Details
                          </h5>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm glass-btn"
                              onClick={addTableRow}
                              disabled={isLoading}
                            >
                              + Add Row
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm glass-btn"
                              onClick={() => setTableGuests([{
                                id: Date.now(),
                                guest_first_name: '',
                                guest_last_name: '',
                                guest_email: '',
                                guest_phone: '',
                                guest_type: 'Bride\'s Family',
                                guest_rsvp_status: 'Pending',
                                guest_address: '',
                                guest_city: '',
                                guest_country: '',
                                guest_dietary_preferences: '',
                                guest_special_requirements: '',
                                guest_notes: ''
                              }])}
                              disabled={isLoading}
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                        
                        {tableGuests.some(g => !g.guest_first_name || !g.guest_last_name) && (
                          <div className="alert alert-warning mb-3">
                            <FaInfoCircle className="me-2" />
                            Please fill in at least first and last name for each guest.
                          </div>
                        )}
                        
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead className="table-light">
                              <tr>
                                <th style={{minWidth: '120px'}}>First Name *</th>
                                <th style={{minWidth: '120px'}}>Last Name *</th>
                                <th style={{minWidth: '180px'}}>Email</th>
                                <th style={{minWidth: '130px'}}>Phone</th>
                                <th style={{minWidth: '140px'}}>Guest Type</th>
                                <th style={{minWidth: '120px'}}>RSVP Status</th>
                                <th style={{width: '100px'}}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableGuests.map((guest, index) => (
                                <tr key={guest.id} className={!guest.guest_first_name || !guest.guest_last_name ? 'table-warning' : ''}>
                                  <td>
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm ${!guest.guest_first_name ? 'is-invalid' : ''}`}
                                      value={guest.guest_first_name}
                                      onChange={(e) => handleTableInputChange(index, 'guest_first_name', e.target.value)}
                                      disabled={isLoading}
                                      placeholder="First name"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm ${!guest.guest_last_name ? 'is-invalid' : ''}`}
                                      value={guest.guest_last_name}
                                      onChange={(e) => handleTableInputChange(index, 'guest_last_name', e.target.value)}
                                      disabled={isLoading}
                                      placeholder="Last name"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="email"
                                      className="form-control form-control-sm"
                                      value={guest.guest_email}
                                      onChange={(e) => handleTableInputChange(index, 'guest_email', e.target.value)}
                                      disabled={isLoading}
                                      placeholder="email@example.com"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="tel"
                                      className="form-control form-control-sm"
                                      value={guest.guest_phone}
                                      onChange={(e) => handleTableInputChange(index, 'guest_phone', e.target.value)}
                                      disabled={isLoading}
                                      placeholder="+1 (___) ___-____"
                                    />
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={guest.guest_type}
                                      onChange={(e) => handleTableInputChange(index, 'guest_type', e.target.value)}
                                      disabled={isLoading}
                                    >
                                      {guestTypeOptions.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={guest.guest_rsvp_status}
                                      onChange={(e) => handleTableInputChange(index, 'guest_rsvp_status', e.target.value)}
                                      disabled={isLoading}
                                    >
                                      {rsvpStatusOptions.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => removeTableRow(index)}
                                      disabled={isLoading || tableGuests.length <= 1}
                                      title="Remove guest"
                                    >
                                      <FaTimes />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Table Info */}
                        <div className="mt-3 p-3 bg-light rounded glass-effect">
                          <div className="d-flex align-items-start">
                            <div className="flex-shrink-0">
                              <FaInfoCircle className="text-primary" />
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <h6 className="mb-1">Table Mode Instructions</h6>
                              <small className="text-muted">
                                • First name and last name are required for each guest<br/>
                                • Click "Add Row" to add more guests<br/>
                                • Only rows with first and last names will be saved<br/>
                                • All guests will be assigned to the selected event
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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