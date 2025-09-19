import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaSort, FaSortUp, FaSortDown, FaDownload, FaUpload } from 'react-icons/fa';
import axios from 'axios';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, sortConfig, statusFilter]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customer_phone?.includes(searchTerm) ||
        customer.customer_city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.customer_status === statusFilter);
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

    setFilteredCustomers(filtered);
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

  const handleDelete = async (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/customers/${customerToDelete.customer_id}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'City', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(customer => [
        customer.customer_id,
        `"${customer.customer_name || ''}"`,
        `"${customer.customer_email || ''}"`,
        `"${customer.customer_phone || ''}"`,
        `"${customer.customer_city || ''}"`,
        customer.customer_status || '',
        new Date(customer.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h2 className="text-dark fw-bold mb-0">Customer Management</h2>
            <p className="text-muted">Manage your customer database</p>
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
              onClick={() => navigate('/customers/import')}
              title="Import Customers"
            >
              <FaUpload className="me-2" />
              Import
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => navigate('/customers/create')}
            >
              <FaPlus className="me-2" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
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
                <div className="text-muted">
                  Showing {filteredCustomers.length} of {customers.length} customers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="table-container glass-table">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('customer_id')}
                  style={{ cursor: 'pointer' }}
                >
                  ID {getSortIcon('customer_id')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('customer_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Name {getSortIcon('customer_name')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('customer_email')}
                  style={{ cursor: 'pointer' }}
                >
                  Email {getSortIcon('customer_email')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('customer_phone')}
                  style={{ cursor: 'pointer' }}
                >
                  Phone {getSortIcon('customer_phone')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('customer_city')}
                  style={{ cursor: 'pointer' }}
                >
                  City {getSortIcon('customer_city')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('customer_status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {getSortIcon('customer_status')}
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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No customers match your filters'
                        : 'No customers found. Create your first customer!'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.customer_id}>
                    <td>#{customer.customer_id}</td>
                    <td className="fw-semibold">{customer.customer_name}</td>
                    <td>{customer.customer_email || '-'}</td>
                    <td>{customer.customer_phone || '-'}</td>
                    <td>{customer.customer_city || '-'}</td>
                    <td>
                      <span className={`badge glass-badge ${
                        customer.customer_status === 'Active' 
                          ? 'bg-success' 
                          : 'bg-secondary'
                      }`}>
                        {customer.customer_status}
                      </span>
                    </td>
                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info glass-btn"
                          onClick={() => navigate(`/customers/${customer.customer_id}`)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary glass-btn"
                          onClick={() => navigate(`/customers/edit/${customer.customer_id}`)}
                          title="Edit Customer"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger glass-btn"
                          onClick={() => handleDelete(customer)}
                          title="Delete Customer"
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
                    <p>Are you sure you want to delete customer <strong>{customerToDelete?.customer_name}</strong>?</p>
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

export default CustomerList;