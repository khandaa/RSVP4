import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { venueAPI } from '../../services/api';
import { toast } from 'react-toastify';

const VenueCreateModal = ({ show, onHide, onVenueCreated }) => {
  const [formData, setFormData] = useState({
    venue_name: '',
    venue_address: '',
    venue_city: '',
    venue_capacity: '',
    customer_id: 1 // Defaulting to 1, you might want to pass this as a prop
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.venue_name.trim()) {
      newErrors.venue_name = 'Venue name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await venueAPI.createVenue(formData);
      if (response.success) {
        onVenueCreated(response.data);
      } else {
        toast.error(response.error || 'Failed to create venue');
      }
    } catch (error) {
      console.error('Error creating venue:', error);
      toast.error('Failed to create venue: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Venue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Venue Name *</Form.Label>
            <Form.Control
              type="text"
              name="venue_name"
              value={formData.venue_name}
              onChange={handleInputChange}
              isInvalid={!!errors.venue_name}
              required
            />
            <Form.Control.Feedback type="invalid">{errors.venue_name}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              name="venue_address"
              value={formData.venue_address}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control
              type="text"
              name="venue_city"
              value={formData.venue_city}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Capacity</Form.Label>
            <Form.Control
              type="number"
              name="venue_capacity"
              value={formData.venue_capacity}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Create Venue'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VenueCreateModal;
