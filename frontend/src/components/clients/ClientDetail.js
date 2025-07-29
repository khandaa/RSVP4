import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Modal
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { clientAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        const response = await clientAPI.getClient(id);
        setClient(response.data);
      } catch (error) {
        toast.error('Failed to fetch client details');
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientData();
  }, [id]);
  
  const handleDelete = async () => {
    try {
      await clientAPI.deleteClient(id);
      toast.success('Client deleted successfully');
      navigate('/clients');
    } catch (error) {
      toast.error('Failed to delete client');
      console.error('Error deleting client:', error);
    }
    setShowDeleteModal(false);
  };
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  
  if (!client) {
    return (
      <Container className="mt-4">
        <div className="alert alert-warning">Client not found</div>
        <Button as={Link} to="/clients" variant="secondary">
          <FaArrowLeft className="me-2" />
          Back to Clients
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Client Details</h2>
        <div>
          <Button 
            as={Link} 
            to="/clients" 
            variant="outline-secondary" 
            className="me-2"
          >
            <FaArrowLeft className="me-1" /> Back
          </Button>
          
          {hasPermission(['client_edit']) && (
            <Button 
              as={Link} 
              to={`/clients/edit/${id}`} 
              variant="primary" 
              className="me-2"
            >
              <FaEdit className="me-1" /> Edit
            </Button>
          )}
          
          {hasPermission(['client_delete']) && (
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash className="me-1" /> Delete
            </Button>
          )}
        </div>
      </div>
      
      <Card className="mb-4" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.17)'
      }}>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5>Basic Information</h5>
              <hr />
              <p><strong>Name:</strong> {client.client_name}</p>
              <p><strong>Email:</strong> {client.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
              <p><strong>Website:</strong> {client.website || 'N/A'}</p>
              <p><strong>Industry:</strong> {client.industry || 'N/A'}</p>
            </Col>
            <Col md={6}>
              <h5>Customer Information</h5>
              <hr />
              <p><strong>Customer:</strong> {client.customer?.name || 'N/A'}</p>
              <p><strong>Created On:</strong> {new Date(client.created_at).toLocaleDateString()}</p>
              <p><strong>Last Updated:</strong> {new Date(client.updated_at).toLocaleDateString()}</p>
            </Col>
          </Row>
          
          <Row className="mt-3">
            <Col>
              <h5>Address</h5>
              <hr />
              <p>{client.address || 'No address provided'}</p>
              <p>
                {[
                  client.city,
                  client.state,
                  client.postal_code,
                  client.country
                ].filter(Boolean).join(', ') || 'No location details provided'}
              </p>
            </Col>
          </Row>
          
          <Row className="mt-3">
            <Col>
              <h5>Additional Information</h5>
              <hr />
              <p>{client.notes || 'No additional information provided'}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this client? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClientDetail;
