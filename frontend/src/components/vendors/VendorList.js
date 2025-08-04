import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup, Badge, Spinner, Modal } from 'react-bootstrap';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { vendorAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/CommonList.css';

const VendorList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && (user.roles.includes('admin') || user.roles.includes('Admin'));
  const isCustomerAdmin = user && user.roles.includes('customer_admin');
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('vendor_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = {};
      
      // Filter by customer_id for customer_admin users
      if (isCustomerAdmin && user.customer_id) {
        params.customer_id = user.customer_id;
      }

      const response = await vendorAPI.getVendors(params);
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  // Handle sort change
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort vendors based on current sort settings
  const sortedVendors = [...vendors].sort((a, b) => {
    if (a[sortField] === null) return 1;
    if (b[sortField] === null) return -1;
    
    const aValue = typeof a[sortField] === 'string' ? a[sortField].toLowerCase() : a[sortField];
    const bValue = typeof b[sortField] === 'string' ? b[sortField].toLowerCase() : b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Filter vendors based on search term
  const filteredVendors = sortedVendors.filter(vendor => {
    return (
      vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.vendor_type && vendor.vendor_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vendor.vendor_email && vendor.vendor_email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Handle vendor deletion
  const handleDelete = async () => {
    if (!selectedVendor) return;
    
    try {
      await vendorAPI.deleteVendor(selectedVendor.vendor_id);
      toast.success('Vendor deleted successfully');
      fetchVendors();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  // Sort icon helper
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  return (
    <Container fluid className="py-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Vendors</h5>
          {(isAdmin || isCustomerAdmin) && (
            <Button
              variant="light"
              size="sm"
              onClick={() => navigate('/vendors/create')}
              title="Add Vendor"
            >
              <FaPlus className="me-1" /> Add Vendor
            </Button>
          )}
        </Card.Header>
        
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, type, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No vendors found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover bordered striped>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('vendor_name')} className="sortable-header">
                      Vendor Name {getSortIcon('vendor_name')}
                    </th>
                    <th onClick={() => handleSort('vendor_type')} className="sortable-header">
                      Type {getSortIcon('vendor_type')}
                    </th>
                    <th onClick={() => handleSort('vendor_email')} className="sortable-header">
                      Email {getSortIcon('vendor_email')}
                    </th>
                    <th onClick={() => handleSort('vendor_phone')} className="sortable-header">
                      Phone {getSortIcon('vendor_phone')}
                    </th>
                    <th onClick={() => handleSort('vendor_status')} className="sortable-header">
                      Status {getSortIcon('vendor_status')}
                    </th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.vendor_id}>
                      <td>{vendor.vendor_name}</td>
                      <td>{vendor.vendor_type || '-'}</td>
                      <td>{vendor.vendor_email || '-'}</td>
                      <td>{vendor.vendor_phone || '-'}</td>
                      <td>
                        <Badge bg={vendor.vendor_status === 'Active' ? 'success' : 'secondary'}>
                          {vendor.vendor_status || 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-1"
                          onClick={() => navigate(`/vendors/${vendor.vendor_id}`)}
                          title="View"
                        >
                          <FaEye />
                        </Button>
                        {(isAdmin || isCustomerAdmin) && (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => navigate(`/vendors/${vendor.vendor_id}/edit`)}
                              title="Edit"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setShowDeleteModal(true);
                              }}
                              title="Delete"
                            >
                              <FaTrash />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete vendor <strong>{selectedVendor?.vendor_name}</strong>?
          This action cannot be undone.
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

export default VendorList;
