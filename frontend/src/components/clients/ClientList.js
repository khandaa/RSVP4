import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaSort, FaSortUp, FaSortDown, FaDownload, FaUpload, FaBuilding } from 'react-icons/fa';
import axios from 'axios';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchData();
    
    // If coming from customer detail, filter by customer
    if (location.state?.customerId) {
      setCustomerFilter(location.state.customerId.toString());
    }
  }, []);

  useEffect(() => {
    filterAndSortClients();
  }, [clients, searchTerm, sortConfig, statusFilter, customerFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [clientsResponse, customersResponse] = await Promise.all([
        axios.get('/api/clients'),
        axios.get('/api/customers')
      ]);
      
      setClients(clientsResponse.data);
      setCustomers(customersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch clients data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortClients = () => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_phone?.includes(searchTerm) ||
        client.client_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.client_status === statusFilter);
    }

    // Apply customer filter
    if (customerFilter !== 'all') {
      filtered = filtered.filter(client => client.customer_id === parseInt(customerFilter));
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredClients(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  const handleDelete = async (client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/clients/${clientToDelete.client_id}`);
      toast.success('Client deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Client Name', 'Customer', 'Email', 'Phone', 'City', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(client => [
        client.client_id,
        `"${client.client_name || ''}"`,
        `"${client.customer_name || ''}"`,
        `"${client.client_email || ''}"`,
        `"${client.client_phone || ''}"`,
        `"${client.client_city || ''}"`,
        client.client_status || '',
        new Date(client.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-dark fw-bold mb-0">Client Management</h2>
            <p className="text-muted">Manage your client database</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary glass-btn"
              onClick={exportToCSV}
              title="Export to CSV"
            >
              <FaDownload className="me-2" />
              Export
            </button>
            <button 
              className="btn btn-outline-success glass-btn"
              onClick={() => navigate('/clients/import')}
              title="Import Clients"
            >
              <FaUpload className="me-2" />
              Import
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => navigate('/clients/create')}
            >
              <FaPlus className="me-2" />
              Add Client
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select glass-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.customer_id} value={customer.customer_id}>
                      {customer.customer_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <div className="text-muted">
                  Showing {filteredClients.length} of {clients.length} clients
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Table */}
        <div className="table-container glass-table">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('client_id')}
                  style={{ cursor: 'pointer' }}
                >
                  ID {getSortIcon('client_id')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('client_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Client Name {getSortIcon('client_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('customer_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Customer {getSortIcon('customer_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('client_email')}
                  style={{ cursor: 'pointer' }}
                >
                  Email {getSortIcon('client_email')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('client_phone')}
                  style={{ cursor: 'pointer' }}
                >
                  Phone {getSortIcon('client_phone')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('client_city')}
                  style={{ cursor: 'pointer' }}
                >
                  City {getSortIcon('client_city')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('client_status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {getSortIcon('client_status')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('created_at')}
                  style={{ cursor: 'pointer' }}
                >
                  Created {getSortIcon('created_at')}
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || statusFilter !== 'all' || customerFilter !== 'all'
                        ? 'No clients match your filters'
                        : 'No clients found. Create your first client!'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.client_id}>
                    <td>#{client.client_id}</td>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center">
                        <FaBuilding className="text-primary me-2" />
                        {client.client_name}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info glass-badge">
                        {client.customer_name}
                      </span>
                    </td>
                    <td>{client.client_email || '-'}</td>
                    <td>{client.client_phone || '-'}</td>
                    <td>{client.client_city || '-'}</td>
                    <td>
                      <span className={`badge glass-badge ${
                        client.client_status === 'Active' 
                          ? 'bg-success' 
                          : 'bg-secondary'
                      }`}>
                        {client.client_status}
                      </span>
                    </td>
                    <td>{new Date(client.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info glass-btn"
                          onClick={() => navigate(`/clients/${client.client_id}`)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary glass-btn"
                          onClick={() => navigate(`/clients/${client.client_id}/edit`)}
                          title="Edit Client"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger glass-btn"
                          onClick={() => handleDelete(client)}
                          title="Delete Client"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                    <p>Are you sure you want to delete client <strong>{clientToDelete?.client_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <small>This action cannot be undone. All related data will be permanently deleted.</small>
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
                      onClick={confirmDelete}
                    >
                      Delete Client
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

export default ClientList;