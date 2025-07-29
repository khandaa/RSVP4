import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSave, FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa';
import axios from 'axios';

const CustomerCreate = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_city: '',
    customer_status: 'Active'
  });
  const [errors, setErrors] = useState({});

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
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    // Email validation
    if (formData.customer_email && !/\S+@\S+\.\S+/.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.customer_phone && !/^\d{10,}$/.test(formData.customer_phone.replace(/\D/g, ''))) {
      newErrors.customer_phone = 'Please enter a valid phone number (10+ digits)';
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
      const response = await axios.post('/api/customers', formData);
      toast.success('Customer created successfully');
      navigate('/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
        toast.error('Please fix the form errors');
      } else {
        toast.error(error.response?.data?.error || 'Failed to create customer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-dark fw-bold mb-0">Create New Customer</h2>
            <p className="text-muted">Add a new customer to your database</p>
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
              form="customerForm"
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
                  Create Customer
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="card glass-card">
              <div className="card-body p-4">
                <form id="customerForm" onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* Customer Name */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <FaUser className="me-2 text-primary" />
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        name="customer_name"
                        className={`form-control glass-input ${errors.customer_name ? 'is-invalid' : ''}`}
                        placeholder="Enter customer name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.customer_name && (
                        <div className="invalid-feedback">{errors.customer_name}</div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaEnvelope className="me-2 text-primary" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="customer_email"
                        className={`form-control glass-input ${errors.customer_email ? 'is-invalid' : ''}`}
                        placeholder="Enter email address"
                        value={formData.customer_email}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.customer_email && (
                        <div className="invalid-feedback">{errors.customer_email}</div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaPhone className="me-2 text-primary" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="customer_phone"
                        className={`form-control glass-input ${errors.customer_phone ? 'is-invalid' : ''}`}
                        placeholder="Enter phone number"
                        value={formData.customer_phone}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                      {errors.customer_phone && (
                        <div className="invalid-feedback">{errors.customer_phone}</div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        <FaMapMarkerAlt className="me-2 text-primary" />
                        Address
                      </label>
                      <textarea
                        name="customer_address"
                        className="form-control glass-input"
                        placeholder="Enter customer address"
                        rows="3"
                        value={formData.customer_address}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* City */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        <FaBuilding className="me-2 text-primary" />
                        City
                      </label>
                      <input
                        type="text"
                        name="customer_city"
                        className="form-control glass-input"
                        placeholder="Enter city"
                        value={formData.customer_city}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Status
                      </label>
                      <select
                        name="customer_status"
                        className="form-select glass-input"
                        value={formData.customer_status}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Form Info */}
                  <div className="mt-4 p-3 bg-light rounded glass-effect">
                    <div className="d-flex align-items-start">
                      <div className="flex-shrink-0">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', fontSize: '12px'}}>
                          i
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-1">Customer Information</h6>
                        <small className="text-muted">
                          • Customer name is required<br/>
                          • Email and phone are optional but recommended for communication<br/>
                          • You can update customer information at any time
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

export default CustomerCreate;