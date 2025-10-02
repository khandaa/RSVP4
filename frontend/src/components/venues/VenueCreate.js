import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaMapMarkerAlt, FaSave, FaTimes } from 'react-icons/fa';
import { venueAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const VenueCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);

  const [formData, setFormData] = useState({
    venue_name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    capacity: '',
    cost_per_day: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    amenities: '',
    customer_id: isAdmin ? '' : (currentUser?.customer_id || ''),
    status: 'active'
  });

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch customers if admin (for dropdown selection)
  useEffect(() => {
    const fetchCustomers = async () => {
      if (isAdmin) {
        setLoading(true);
        try {
          // Use the customerAPI directly from the api.js file for better reliability
          const response = await venueAPI.getCustomers();
          console.log('Fetched customers:', response.data);
          
          if (Array.isArray(response.data)) {
            setCustomers(response.data);
          } else if (response.data && Array.isArray(response.data.customers)) {
            // Handle case where customers might be nested in the response
            setCustomers(response.data.customers);
          } else {
            console.error('Unexpected customers data format:', response.data);
            toast.error('Received invalid customer data format from server');
            setCustomers([]);
          }
        } catch (error) {
          console.error("Failed to fetch customers:", error);
          toast.error("Failed to load customers. Some features may be limited.");
          setCustomers([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCustomers();
  }, [isAdmin]);

  // Fetch venue data if in edit mode
  useEffect(() => {
    const fetchVenue = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const response = await venueAPI.getVenue(id);
          
          // Check if user has permission to edit this venue
          const venue = response.data;
          if (!isAdmin && venue.customer_id !== currentUser.customer_id) {
            toast.error("You don't have permission to edit this venue.");
            navigate('/venues/list');
            return;
          }
          
          setFormData({
            venue_name: venue.venue_name || '',
            address: venue.address || '',
            city: venue.city || '',
            state: venue.state || '',
            postal_code: venue.postal_code || '',
            country: venue.country || 'USA',
            capacity: venue.capacity || '',
            cost_per_day: venue.cost_per_day || '',
            contact_person: venue.contact_person || '',
            contact_email: venue.contact_email || '',
            contact_phone: venue.contact_phone || '',
            description: venue.description || '',
            amenities: venue.amenities || '',
            customer_id: venue.customer_id || '',
            status: venue.status || 'active'
          });
        } catch (error) {
          console.error("Failed to fetch venue:", error);
          toast.error("Failed to load venue data. Please try again later.");
          navigate('/venues/list');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchVenue();
  }, [id, isEditMode, navigate, isAdmin, currentUser]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.venue_name.trim()) errors.venue_name = 'Venue name is required';
    if (formData.capacity && (isNaN(formData.capacity) || parseInt(formData.capacity) < 1)) {
      errors.capacity = 'Capacity must be a positive number';
    }
    
    if (formData.cost_per_day && (isNaN(formData.cost_per_day) || parseFloat(formData.cost_per_day) < 0)) {
      errors.cost_per_day = 'Cost must be a non-negative number';
    }
    
    if (isAdmin && !formData.customer_id) errors.customer_id = 'Please select a customer';
    
    if (formData.contact_email && !formData.contact_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.contact_email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Prepare data for submission (convert numeric fields)
      const submissionData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        cost_per_day: parseFloat(formData.cost_per_day),
      };
      
      if (isEditMode) {
        await venueAPI.updateVenue(id, submissionData);
        toast.success("Venue updated successfully!");
      } else {
        await venueAPI.createVenue(submissionData);
        toast.success("New venue created successfully!");
      }
      
      navigate('/venues/list');
    } catch (error) {
      console.error("Failed to save venue:", error);
      setError('Failed to save venue. Please try again later.');
      toast.error("Failed to save venue. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading venue data...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>
            <FaMapMarkerAlt className="me-2" />
            {isEditMode ? 'Edit Venue' : 'Create New Venue'}
          </h1>
          <p className="text-muted">
            {isEditMode 
              ? 'Update the venue information below' 
              : 'Fill in the details to add a new venue'}
          </p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Venue Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="venue_name"
                    value={formData.venue_name}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.venue_name}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.venue_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              {isAdmin && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Customer*</Form.Label>
                    <Form.Select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.customer_id}
                      required
                      disabled={customers.length === 0}
                    >
                      <option value="">{customers.length === 0 ? 'Loading customers...' : 'Select Customer'}</option>
                      {customers.map(customer => (
                        <option 
                          key={customer.id || customer.customer_id} 
                          value={customer.id || customer.customer_id}
                        >
                          {customer.name || customer.customer_name || customer.company_name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.customer_id}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.address}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.address}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.city}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.city}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>State/Province</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity (people)</Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.capacity}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.capacity}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Cost per Day ($)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="cost_per_day"
                    value={formData.cost_per_day}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.cost_per_day}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.cost_per_day}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.contact_email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.contact_email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Amenities</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="List available amenities (e.g., Parking, WiFi, AV Equipment)"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/venues/list')}
                disabled={submitting}
              >
                <FaTimes className="me-2" /> Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    {isEditMode ? 'Update Venue' : 'Create Venue'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VenueCreate;
