import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { vendorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const VendorCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user } = useAuth();
  const isAdmin = user && (user.roles.includes('admin') || user.roles.includes('Admin'));
  
  const [loading, setLoading] = useState(false);
  const [savingData, setSavingData] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vendorTypes, setVendorTypes] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_id: user?.customer_id || '',
    vendor_name: '',
    vendor_type: '',
    vendor_email: '',
    vendor_phone: '',
    vendor_address: '',
    vendor_status: 'Active'
  });

  const [validationErrors, setValidationErrors] = useState({});

  const fetchVendor = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vendorAPI.getVendor(id);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error('Failed to load vendor data');
      navigate('/vendors/list');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchVendorTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/master-data/vendor-types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVendorTypes(data);
      } else {
        throw new Error('Failed to fetch vendor types');
      }
    } catch (error) {
      console.error('Error fetching vendor types:', error);
      toast.error('Failed to load vendor types');
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      // Using the existing customer API
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  }, []);

  // Load vendor data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchVendor();
    }
    
    // Load vendor types for dropdown
    fetchVendorTypes();
    
    // Load customers for admin users
    if (isAdmin) {
      fetchCustomers();
    }
  }, [isEditMode, isAdmin, fetchVendor, fetchVendorTypes, fetchCustomers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customer_id) {
      errors.customer_id = 'Customer is required';
    }
    
    if (!formData.vendor_name || formData.vendor_name.trim() === '') {
      errors.vendor_name = 'Vendor name is required';
    }
    
    if (formData.vendor_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.vendor_email)) {
      errors.vendor_email = 'Please enter a valid email address';
    }
    
    if (formData.vendor_phone && !/^[0-9+\-() ]+$/.test(formData.vendor_phone)) {
      errors.vendor_phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    setSavingData(true);
    try {
      if (isEditMode) {
        await vendorAPI.updateVendor(id, formData);
        toast.success('Vendor updated successfully');
      } else {
        await vendorAPI.createVendor(formData);
        toast.success('Vendor added successfully');
      }
      navigate('/vendors/list');
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error(error.response?.data?.error || 'Failed to save vendor');
    } finally {
      setSavingData(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              {isAdmin && (
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Customer <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      isInvalid={!!validationErrors.customer_id}
                      disabled={!isAdmin}
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.customer_id} value={customer.customer_id}>
                          {customer.customer_name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.customer_id}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}
              
              <Col md={isAdmin ? 6 : 12} className="mb-3">
                <Form.Group>
                  <Form.Label>Vendor Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.vendor_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.vendor_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Vendor Type</Form.Label>
                  <Form.Select
                    name="vendor_type"
                    value={formData.vendor_type || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    {vendorTypes.map((type) => (
                      <option key={type.vendor_type_id} value={type.vendor_type_name}>
                        {type.vendor_type_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="vendor_status"
                    value={formData.vendor_status || 'Active'}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="vendor_email"
                    value={formData.vendor_email || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.vendor_email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.vendor_email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="vendor_phone"
                    value={formData.vendor_phone || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.vendor_phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.vendor_phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="vendor_address"
                    value={formData.vendor_address || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/vendors/list')}
                disabled={savingData}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={savingData}
              >
                {savingData ? (
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
                ) : isEditMode ? 'Update Vendor' : 'Add Vendor'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VendorCreate;
