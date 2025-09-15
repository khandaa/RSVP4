import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Badge } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaEdit, FaArrowLeft, FaCalendarAlt, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import { venueAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const VenueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['Customer Admin']);

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const response = await venueAPI.getVenue(id);
        setVenue(response.data);

        // Check if user has permission to view this venue
        if (!isAdmin && response.data.customer_id !== currentUser.customer_id) {
          toast.error("You don't have permission to view this venue.");
          navigate('/venues/list');
        }
      } catch (error) {
        console.error("Failed to fetch venue:", error);
        toast.error("Failed to load venue information. Please try again later.");
        navigate('/venues/list');
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id, navigate, isAdmin, currentUser]);

  useEffect(() => {
    const fetchVenueEvents = async () => {
      if (!venue) return;
      
      try {
        const response = await venueAPI.getVenueEvents(id);
        setEvents(response.data);
      } catch (error) {
        console.error("Failed to fetch venue events:", error);
        setEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchVenueEvents();
  }, [id, venue]);

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading venue information...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-2 mb-4">
            <Button
              variant="outline-secondary"
              size="sm"
              as={Link}
              to="/venues/list"
            >
              <FaArrowLeft /> Back to Venues
            </Button>
          </div>
          
          <div className="d-flex justify-content-between align-items-center">
            <h1>
              <FaMapMarkerAlt className="me-2" />
              {venue.venue_name}
            </h1>
            
            {(isAdmin || (isCustomerAdmin && venue.customer_id === currentUser.customer_id)) && (
              <Button
                variant="primary"
                as={Link}
                to={`/venues/${id}/edit`}
              >
                <FaEdit className="me-2" />
                Edit Venue
              </Button>
            )}
          </div>
          
          <Badge bg={venue.status === 'active' ? 'success' : 'danger'} className="mb-3">
            {venue.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Venue Information</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Address:</Col>
                <Col sm={8}>{venue.address}</Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">City:</Col>
                <Col sm={8}>{venue.city}</Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">State/Province:</Col>
                <Col sm={8}>{venue.state || 'N/A'}</Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Postal Code:</Col>
                <Col sm={8}>{venue.postal_code || 'N/A'}</Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Country:</Col>
                <Col sm={8}>{venue.country || 'N/A'}</Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Capacity:</Col>
                <Col sm={8}>{venue.capacity} people</Col>
              </Row>
              
              <Row className="mb-3">
                <Col sm={4} className="fw-bold">Cost per Day:</Col>
                <Col sm={8}>${venue.cost_per_day.toFixed(2)}</Col>
              </Row>
              
              {isAdmin && (
                <Row className="mb-3">
                  <Col sm={4} className="fw-bold">Customer:</Col>
                  <Col sm={8}>{venue.customer_name || 'N/A'}</Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Description</h5>
            </Card.Header>
            <Card.Body>
              {venue.description ? (
                <p>{venue.description}</p>
              ) : (
                <p className="text-muted">No description available.</p>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Amenities</h5>
            </Card.Header>
            <Card.Body>
              {venue.amenities ? (
                <div>
                  {venue.amenities.split(',').map((amenity, index) => (
                    <Badge 
                      key={index} 
                      bg="info" 
                      className="me-2 mb-2"
                      style={{ fontSize: '0.9rem' }}
                    >
                      {amenity.trim()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No amenities listed.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Contact Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <FaUser className="me-3 text-primary" />
                <div>
                  <div className="text-muted small">Contact Person</div>
                  <div>{venue.contact_person || 'Not specified'}</div>
                </div>
              </div>
              
              <div className="d-flex align-items-center mb-3">
                <FaEnvelope className="me-3 text-primary" />
                <div>
                  <div className="text-muted small">Email</div>
                  <div>
                    {venue.contact_email ? (
                      <a href={`mailto:${venue.contact_email}`}>{venue.contact_email}</a>
                    ) : (
                      'Not specified'
                    )}
                  </div>
                </div>
              </div>
              
              <div className="d-flex align-items-center">
                <FaPhone className="me-3 text-primary" />
                <div>
                  <div className="text-muted small">Phone</div>
                  <div>
                    {venue.contact_phone ? (
                      <a href={`tel:${venue.contact_phone}`}>{venue.contact_phone}</a>
                    ) : (
                      'Not specified'
                    )}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Upcoming Events</h5>
            </Card.Header>
            <Card.Body>
              {loadingEvents ? (
                <div className="text-center py-3">
                  <Spinner animation="border" variant="primary" size="sm" />
                  <p className="mt-2">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <p className="text-muted">No upcoming events at this venue.</p>
              ) : (
                <ul className="list-unstyled">
                  {events.map(event => (
                    <li key={event.id} className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-start">
                        <FaCalendarAlt className="me-2 text-primary mt-1" />
                        <div>
                          <Link to={`/events/${event.id}`} className="fw-bold d-block">
                            {event.event_name}
                          </Link>
                          <div className="small text-muted">
                            {new Date(event.start_date).toLocaleDateString()} - 
                            {new Date(event.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3">
                <Link to="/events/create" className="btn btn-outline-primary btn-sm w-100">
                  Schedule Event at this Venue
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VenueDetail;
