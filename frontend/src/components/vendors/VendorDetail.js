import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { FaEdit, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { vendorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const VendorDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user && (user.roles.includes('admin') || user.roles.includes('Admin'));
  const isCustomerAdmin = user && user.roles.includes('customer_admin');
  
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');

  const fetchCustomerName = useCallback(async (customerId) => {
    try {
      // Using the existing customer API
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomerName(data.customer_name);
      } else {
        throw new Error('Failed to fetch customer');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  }, []);

  const fetchVendor = useCallback(async () => {
    setLoading(true);
    try {
      const response = await vendorAPI.getVendor(id);
      setVendor(response.data);
      
      // Get customer name if we have customer_id
      if (response.data.customer_id) {
        fetchCustomerName(response.data.customer_id);
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error('Failed to load vendor details');
      navigate('/vendors/list');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, fetchCustomerName]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!vendor) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h4>Vendor not found</h4>
          <Button variant="primary" onClick={() => navigate('/vendors/list')}>
            Back to Vendors
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Vendor Details</h5>
          <div>
            {(isAdmin || (isCustomerAdmin && user.customer_id === vendor.customer_id)) && (
              <Button
                variant="light"
                size="sm"
                className="me-2"
                onClick={() => navigate(`/vendors/${id}/edit`)}
              >
                <FaEdit className="me-1" /> Edit
              </Button>
            )}
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => navigate('/vendors/list')}
            >
              <FaArrowLeft className="me-1" /> Back
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Vendor Information</h6>
                </Card.Header>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Vendor Name:</strong> {vendor.vendor_name}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Customer:</strong> {customerName || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Type:</strong> {vendor.vendor_type || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Status:</strong>{' '}
                    <Badge bg={vendor.vendor_status === 'Active' ? 'success' : 'secondary'}>
                      {vendor.vendor_status || 'Inactive'}
                    </Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Contact Information</h6>
                </Card.Header>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Email:</strong> {vendor.vendor_email || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Phone:</strong> {vendor.vendor_phone || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Address:</strong>
                    <p className="mb-0 mt-1">
                      {vendor.vendor_address || 'No address provided'}
                    </p>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card>
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Additional Information</h6>
                </Card.Header>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Created:</strong>{' '}
                    {vendor.created_at ? new Date(vendor.created_at).toLocaleString() : 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Last Updated:</strong>{' '}
                    {vendor.updated_at ? new Date(vendor.updated_at).toLocaleString() : 'N/A'}
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VendorDetail;
