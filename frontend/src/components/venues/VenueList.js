import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Form, InputGroup, Badge, Spinner, Modal } from 'react-bootstrap';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaEdit, FaTrash, FaEye, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { venueAPI } from '../../services/api';
import '../../styles/CommonList.css';

const VenueList = () => {
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['Customer Admin']);
  
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('venue_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (isAdmin) {
        response = await venueAPI.getAllVenues(sortField, sortDirection);
      } else if (isCustomerAdmin) {
        response = await venueAPI.getCustomerVenues(currentUser.customer_id, sortField, sortDirection);
      } else {
        setVenues([]);
        setLoading(false);
        return;
      }
      setVenues(response.data);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      toast.error("Failed to load venues. Please try again later.");
      setVenues([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isCustomerAdmin, currentUser, sortField, sortDirection]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="sort-icon" />;
    if (sortDirection === 'asc') return <FaSortUp className="sort-icon" />;
    return <FaSortDown className="sort-icon" />;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredVenues = venues.filter(venue =>
    venue.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (venue) => {
    setVenueToDelete(venue);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!venueToDelete) return;
    
    try {
      await venueAPI.deleteVenue(venueToDelete.id);
      toast.success("Venue deleted successfully");
      setShowDeleteModal(false);
      fetchVenues();
    } catch (error) {
      console.error("Failed to delete venue:", error);
      toast.error("Failed to delete venue. Please try again later.");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setVenueToDelete(null);
  };

  return (
    <Container className="py-4 list-container">
      <Row className="mb-4">
        <Col>
          <h1>
            <FaMapMarkerAlt className="me-2" />
            Venue Management
          </h1>
          <p className="text-muted">Manage venues for your events and activities</p>
        </Col>
        {(isAdmin || isCustomerAdmin) && (
          <Col xs="auto" className="align-self-center">
            <Link to="/venues/create">
              <Button variant="primary">
                <FaPlus className="me-2" />
                Add New Venue
              </Button>
            </Link>
          </Col>
        )}
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          <Row className="mb-3 search-container">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search venues by name, address, city, or contact person..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading venues...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No venues found. {searchTerm && 'Try a different search term or '} 
                <Link to="/venues/create">add a new venue</Link>.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="table-container">
                <thead className="table-header">
                  <tr>
                    <th onClick={() => handleSort('venue_name')} style={{ cursor: 'pointer' }}>
                      Venue Name {renderSortIcon('venue_name')}
                    </th>
                    <th onClick={() => handleSort('city')} style={{ cursor: 'pointer' }}>
                      City {renderSortIcon('city')}
                    </th>
                    <th onClick={() => handleSort('capacity')} style={{ cursor: 'pointer' }}>
                      Capacity {renderSortIcon('capacity')}
                    </th>
                    <th onClick={() => handleSort('cost_per_day')} style={{ cursor: 'pointer' }}>
                      Cost per Day {renderSortIcon('cost_per_day')}
                    </th>
                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                      Status {renderSortIcon('status')}
                    </th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVenues.map((venue) => (
                    <tr key={venue.id}>
                      <td>{venue.venue_name}</td>
                      <td>{venue.city}</td>
                      <td>{venue.capacity} people</td>
                      <td>${venue.cost_per_day.toFixed(2)}</td>
                      <td>
                        <Badge bg={venue.status === 'active' ? 'success' : 'danger'} pill>
                          {venue.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="action-buttons">
                          <Link to={`/venues/${venue.id}`}>
                            <Button variant="outline-info" size="sm" className="me-1">
                              <FaEye /> View
                            </Button>
                          </Link>
                          
                          {(isAdmin || isCustomerAdmin) && (
                            <>
                              <Link to={`/venues/${venue.id}/edit`}>
                                <Button variant="outline-primary" size="sm" className="me-1">
                                  <FaEdit /> Edit
                                </Button>
                              </Link>
                              
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDeleteClick(venue)}
                              >
                                <FaTrash /> Delete
                              </Button>
                            </>
                          )}
                        </div>
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
      <Modal show={showDeleteModal} onHide={handleDeleteCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the venue "{venueToDelete?.venue_name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Venue
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VenueList;
