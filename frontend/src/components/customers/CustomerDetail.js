import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaBuilding,
  FaCalendar,
  FaUsers,
  FaEye
} from 'react-icons/fa';
import axios from 'axios';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch customer details
      const customerResponse = await axios.get(`/api/customers/${id}`);
      setCustomer(customerResponse.data);

      // Fetch related clients
      const clientsResponse = await axios.get('/api/clients');
      const customerClients = clientsResponse.data.filter(
        client => client.customer_id === parseInt(id)
      );
      setClients(customerClients);

    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error('Failed to fetch customer details');
      navigate('/customers');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/customers/${id}`);
      toast.success('Customer deleted successfully');
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <h4 className="text-muted">Customer not found</h4>
          <button 
            className="btn btn-primary glass-btn-primary mt-3"
            onClick={() => navigate('/customers')}
          >
            Back to Customers
          </button>
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
              onClick={() => navigate('/customers')}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">{customer.customer_name}</h2>
              <p className="text-muted mb-0">Customer Details</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={() => navigate(`/customers/${id}/edit`)}
            >
              <FaEdit className="me-2" />
              Edit
            </button>
            <button 
              className="btn btn-outline-danger glass-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              <FaTrash className="me-2" />
              Delete
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* Customer Information */}
          <div className="col-lg-8">
            <div className="card glass-card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <FaUser className="me-2 text-primary" />
                  Customer Information
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="info-item">
                      <label className="form-label fw-semibold text-muted">
                        <FaUser className="me-2" />
                        Customer Name
                      </label>
                      <p className="fs-5 fw-semibold text-dark">{customer.customer_name}</p>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="info-item">
                      <label className="form-label fw-semibold text-muted">
                        Status
                      </label>
                      <div>
                        <span className={`badge glass-badge fs-6 ${
                          customer.customer_status === 'Active' 
                            ? 'bg-success' 
                            : 'bg-secondary'
                        }`}>
                          {customer.customer_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="info-item">
                      <label className="form-label fw-semibold text-muted">
                        <FaEnvelope className="me-2" />
                        Email Address
                      </label>
                      <p className="text-dark">
                        {customer.customer_email ? (
                          <a href={`mailto:${customer.customer_email}`} className="text-decoration-none">
                            {customer.customer_email}
                          </a>
                        ) : (
                          <span className="text-muted">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="info-item">
                      <label className="form-label fw-semibold text-muted">
                        <FaPhone className="me-2" />
                        Phone Number
                      </label>
                      <p className="text-dark">
                        {customer.customer_phone ? (
                          <a href={`tel:${customer.customer_phone}`} className="text-decoration-none">
                            {customer.customer_phone}
                          </a>
                        ) : (
                          <span className="text-muted">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="info-item">
                      <label className="form-label fw-semibold text-muted">
                        <FaBuilding className="me-2" />
                        City
                      </label>
                      <p className="text-dark">
                        {customer.customer_city || <span className="text-muted">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="info-item">
                      <label className="form-label fw-semibold text-muted">
                        <FaCalendar className="me-2" />
                        Created Date
                      </label>
                      <p className="text-dark">
                        {new Date(customer.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {customer.customer_address && (
                    <div className="col-12">
                      <div className="info-item">
                        <label className="form-label fw-semibold text-muted">
                          <FaMapMarkerAlt className="me-2" />
                          Address
                        </label>
                        <p className="text-dark">{customer.customer_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats & Related Data */}
          <div className="col-lg-4">
            {/* Stats Card */}
            <div className="card glass-card mb-4">
              <div className="card-header">
                <h6 className="card-title mb-0">Quick Stats</h6>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <FaUsers className="text-primary me-2" />
                    <span>Total Clients</span>
                  </div>
                  <span className="badge bg-primary glass-badge fs-6">{clients.length}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaCalendar className="text-success me-2" />
                    <span>Member Since</span>
                  </div>
                  <span className="text-muted">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Clients */}
            <div className="card glass-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0">
                  <FaUsers className="me-2" />
                  Related Clients
                </h6>
                {clients.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-primary glass-btn"
                    onClick={() => navigate('/clients', { state: { customerId: id } })}
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="card-body">
                {clients.length === 0 ? (
                  <div className="text-center py-3">
                    <FaUsers className="text-muted mb-2" size={24} />
                    <p className="text-muted mb-2">No clients yet</p>
                    <button 
                      className="btn btn-sm btn-primary glass-btn-primary"
                      onClick={() => navigate('/clients/create', { state: { customerId: id } })}
                    >
                      Add First Client
                    </button>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {clients.slice(0, 3).map((client) => (
                      <div key={client.client_id} className="list-group-item glass-effect border-0 px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{client.client_name}</h6>
                            <small className="text-muted">
                              {client.client_email || 'No email'}
                            </small>
                          </div>
                          <button 
                            className="btn btn-sm btn-outline-info glass-btn"
                            onClick={() => navigate(`/clients/${client.client_id}`)}
                            title="View Client"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    ))}
                    {clients.length > 3 && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          and {clients.length - 3} more client{clients.length - 3 !== 1 ? 's' : ''}
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040 
            }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowDeleteModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete customer <strong>{customer.customer_name}</strong>?</p>
                    {clients.length > 0 && (
                      <div className="alert alert-warning">
                        <strong>Warning:</strong> This customer has {clients.length} associated client{clients.length !== 1 ? 's' : ''}. 
                        Deleting this customer may affect related data.
                      </div>
                    )}
                    <div className="alert alert-danger">
                      <small>This action cannot be undone.</small>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger glass-btn-danger"
                      onClick={handleDelete}
                    >
                      Delete Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;