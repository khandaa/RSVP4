import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Spinner,
  Alert
} from 'react-bootstrap';
import { FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import api, { clientAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const ClientEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    client_name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch client data
        const clientResponse = await clientAPI.getClient(id);
        
        // Fetch customers for dropdown
        const customersResponse = await api.get('/api/customers');
        setCustomers(customersResponse.data);
        
        // Populate form with client data
        setFormData({
          customer_id: clientResponse.data.customer_id || '',
          client_name: clientResponse.data.client_name || '',
          email: clientResponse.data.email || '',
          phone: clientResponse.data.phone || '',
          website: clientResponse.data.website || '',
          industry: clientResponse.data.industry || '',
          address: clientResponse.data.address || '',
          city: clientResponse.data.city || '',
          state: clientResponse.data.state || '',
          postal_code: clientResponse.data.postal_code || '',
          country: clientResponse.data.country || '',
          notes: clientResponse.data.notes || ''
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load client data');
        toast.error('Failed to load client data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.client_name || formData.client_name.trim() === '') {
      newErrors.client_name = 'Client name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^\+?[0-9\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.website && !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      await clientAPI.updateClient(id, formData);
      toast.success('Client updated successfully!');
      navigate(`/clients/${id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      
      if (error.response && error.response.data && error.response.data.errors) {
        // Format backend validation errors
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
      } else {
        toast.error('Failed to update client');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!hasPermission(['client_edit'])) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">
          You don't have permission to edit clients.
        </div>
        <Button as={Link} to={`/clients/${id}`} variant="secondary">
          Back to Client Details
        </Button>
      </Container>
    );
  }
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/clients" variant="secondary">
          <FaArrowLeft className="me-2" /> Back to Clients
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Edit Client</h2>
        <Button as={Link} to={`/clients/${id}`} variant="outline-secondary">
          <FaTimes className="me-1" /> Cancel
        </Button>
      </div>
      
      <Card style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.17)'
      }}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer *</Form.Label>
                  <Form.Select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    isInvalid={!!errors.customer_id}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.customer_id}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Client Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    isInvalid={!!errors.client_name}
                    placeholder="Enter client name"
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.client_name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="Enter email address"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    isInvalid={!!errors.phone}
                    placeholder="Enter phone number"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    isInvalid={!!errors.website}
                    placeholder="Enter website URL"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.website}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Industry</Form.Label>
                  <Form.Control
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    isInvalid={!!errors.industry}
                    placeholder="Enter industry"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.industry}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>State/Province</Form.Label>
                  <Form.Control
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Enter postal code"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Enter notes or additional information"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end mt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="d-flex align-items-center"
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
                    <FaSave className="me-2" /> Update Client
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

export default ClientEdit;
