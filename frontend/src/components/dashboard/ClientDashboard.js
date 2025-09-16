import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Table, Badge, ProgressBar } from 'react-bootstrap';
import { 
  FaCalendarAlt, FaCalendarDay, FaUsers, FaEnvelopeOpenText, 
  FaPlane, FaBed, FaChartPie 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ClientDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    events: [],
    subEvents: [],
    guests: [],
    rsvps: { 
      confirmed: 0,
      declined: 0,
      pending: 0,
      total: 0 
    },
    travel: {
      booked: 0,
      pending: 0,
      total: 0
    },
    accommodation: {
      booked: 0,
      pending: 0,
      total: 0
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // For now, fetch all events that the user has access to based on their role
        // The backend handles filtering based on user permissions
        const eventsResponse = await axios.get('/api/events');
        const allEvents = eventsResponse.data || [];

        // Filter for active/planned events only
        const events = allEvents.filter(event =>
          event.event_status === 'active' ||
          event.event_status === 'Planned' ||
          event.event_status === 'planned'
        );
        
        // Fetch all sub-events
        let allSubEvents = [];
        try {
          const subEventsResponse = await axios.get('/api/comprehensive-crud/rsvp_master_subevents');
          allSubEvents = subEventsResponse.data.map(subEvent => {
            const parentEvent = events.find(e => e.event_id === subEvent.event_id);
            return {
              ...subEvent,
              event_name: parentEvent?.event_name || 'Unknown Event'
            };
          });
        } catch (error) {
          console.warn('Could not fetch sub-events:', error);
        }
        
        // Fetch all guests
        let allGuests = [];
        let rsvpStats = { confirmed: 0, declined: 0, pending: 0, total: 0 };
        let travelStats = { booked: 0, pending: 0, total: 0 };
        let accommodationStats = { booked: 0, pending: 0, total: 0 };

        try {
          const guestsResponse = await axios.get('/api/comprehensive-crud/rsvp_master_guests');
          const allGuestsData = guestsResponse.data || [];

          // Filter guests for events that are available to this user
          allGuests = allGuestsData
            .filter(guest => events.some(e => e.event_id === guest.event_id))
            .map(guest => {
              const event = events.find(e => e.event_id === guest.event_id);
              return {
                ...guest,
                event_name: event?.event_name || 'Unknown Event',
                guest_name: `${guest.guest_first_name || ''} ${guest.guest_last_name || ''}`.trim()
              };
            });

          // Calculate RSVP statistics
          rsvpStats.total = allGuests.length;
          rsvpStats.confirmed = allGuests.filter(g =>
            g.guest_rsvp_status === 'confirmed' || g.guest_rsvp_status === 'Confirmed'
          ).length;
          rsvpStats.declined = allGuests.filter(g =>
            g.guest_rsvp_status === 'declined' || g.guest_rsvp_status === 'Declined'
          ).length;
          rsvpStats.pending = allGuests.filter(g =>
            g.guest_rsvp_status === 'pending' || g.guest_rsvp_status === 'Pending' || !g.guest_rsvp_status
          ).length;

          // Calculate travel statistics
          const needTravel = allGuests.filter(g => g.requires_travel);
          travelStats.total = needTravel.length;
          travelStats.booked = needTravel.filter(g => g.travel_status === 'booked').length;
          travelStats.pending = needTravel.filter(g => g.travel_status !== 'booked').length;

          // Calculate accommodation statistics
          const needAccommodation = allGuests.filter(g => g.requires_accommodation);
          accommodationStats.total = needAccommodation.length;
          accommodationStats.booked = needAccommodation.filter(g => g.accommodation_status === 'booked').length;
          accommodationStats.pending = needAccommodation.filter(g => g.accommodation_status !== 'booked').length;

        } catch (error) {
          console.warn('Could not fetch guests:', error);
        }
        
        setDashboardData({
          events: events,
          subEvents: allSubEvents,
          guests: allGuests,
          rsvps: rsvpStats,
          travel: travelStats,
          accommodation: accommodationStats
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching client dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  const navigateTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading dashboard data...</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h2 className="mb-4">Client Dashboard</h2>
      
      <Row className="mb-4">
        {/* Active Events Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <FaCalendarAlt className="me-2" />
                <span>Active Events</span>
              </div>
              <span className="badge bg-light text-primary">{dashboardData.events.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Guests</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.events.length > 0 ? (
                      dashboardData.events.map((event) => (
                        <tr key={event.event_id}>
                          <td>{event.event_name}</td>
                          <td>{event.event_start_date ? new Date(event.event_start_date).toLocaleDateString() : 'Not set'}</td>
                          <td>{dashboardData.guests.filter(g => g.event_id === event.event_id).length}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => navigateTo(`/events/${event.event_id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No active events found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => navigateTo('/events/list')}
                className="w-100"
              >
                Manage Events
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        {/* Sub Events Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
              <div>
                <FaCalendarDay className="me-2" />
                <span>Sub Events</span>
              </div>
              <span className="badge bg-light text-secondary">{dashboardData.subEvents.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Sub Event</th>
                      <th>Parent Event</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.subEvents.length > 0 ? (
                      dashboardData.subEvents.map((subEvent) => (
                        <tr key={subEvent.sub_event_id}>
                          <td>{subEvent.sub_event_name}</td>
                          <td>{subEvent.event_name}</td>
                          <td>{new Date(subEvent.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-secondary"
                              onClick={() => navigateTo(`/events/${subEvent.event_id}/sub-events/${subEvent.sub_event_id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No sub events found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => navigateTo('/subevents/list')}
                className="w-100"
              >
                View All Sub Events
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        {/* Guests Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
              <div>
                <FaUsers className="me-2" />
                <span>Guests</span>
              </div>
              <span className="badge bg-light text-info">{dashboardData.guests.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Event</th>
                      <th>RSVP</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.guests.length > 0 ? (
                      dashboardData.guests.slice(0, 10).map((guest) => (
                        <tr key={guest.guest_id}>
                          <td>{guest.guest_name}</td>
                          <td>{guest.event_name}</td>
                          <td>
                            <Badge bg={
                              guest.rsvp_status === 'confirmed' ? 'success' :
                              guest.rsvp_status === 'declined' ? 'danger' : 'warning'
                            }>
                              {guest.rsvp_status || 'Pending'}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-info"
                              onClick={() => navigateTo(`/guests/${guest.guest_id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No guests found</td>
                      </tr>
                    )}
                    {dashboardData.guests.length > 10 && (
                      <tr>
                        <td colSpan="4" className="text-center">
                          <em>Showing 10 of {dashboardData.guests.length} guests</em>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="info" 
                size="sm"
                onClick={() => navigateTo('/guests/list')}
                className="w-100 text-white"
              >
                Manage Guests
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        {/* RSVPs Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
              <div>
                <FaEnvelopeOpenText className="me-2" />
                <span>RSVPs</span>
              </div>
              <span className="badge bg-light text-success">
                {dashboardData.rsvps.confirmed} / {dashboardData.rsvps.total}
              </span>
            </Card.Header>
            <Card.Body>
              <h5 className="card-title">RSVP Status</h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Confirmed</span>
                  <span>{dashboardData.rsvps.total > 0 ? Math.round((dashboardData.rsvps.confirmed / dashboardData.rsvps.total) * 100) : 0}%</span>
                </div>
                <ProgressBar
                  variant="success"
                  now={dashboardData.rsvps.total > 0 ? (dashboardData.rsvps.confirmed / dashboardData.rsvps.total) * 100 : 0}
                  className="mb-3"
                />

                <div className="d-flex justify-content-between mb-1">
                  <span>Declined</span>
                  <span>{dashboardData.rsvps.total > 0 ? Math.round((dashboardData.rsvps.declined / dashboardData.rsvps.total) * 100) : 0}%</span>
                </div>
                <ProgressBar
                  variant="danger"
                  now={dashboardData.rsvps.total > 0 ? (dashboardData.rsvps.declined / dashboardData.rsvps.total) * 100 : 0}
                  className="mb-3"
                />

                <div className="d-flex justify-content-between mb-1">
                  <span>Pending</span>
                  <span>{dashboardData.rsvps.total > 0 ? Math.round((dashboardData.rsvps.pending / dashboardData.rsvps.total) * 100) : 0}%</span>
                </div>
                <ProgressBar
                  variant="warning"
                  now={dashboardData.rsvps.total > 0 ? (dashboardData.rsvps.pending / dashboardData.rsvps.total) * 100 : 0}
                />
              </div>
              
              <div className="text-center mt-3">
                <div className="row">
                  <div className="col-4">
                    <div className="h4 mb-0 text-success">{dashboardData.rsvps.confirmed}</div>
                    <small className="text-muted">Confirmed</small>
                  </div>
                  <div className="col-4">
                    <div className="h4 mb-0 text-danger">{dashboardData.rsvps.declined}</div>
                    <small className="text-muted">Declined</small>
                  </div>
                  <div className="col-4">
                    <div className="h4 mb-0 text-warning">{dashboardData.rsvps.pending}</div>
                    <small className="text-muted">Pending</small>
                  </div>
                </div>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="success" 
                size="sm"
                onClick={() => navigateTo('/rsvps/list')}
                className="w-100"
              >
                Manage RSVPs
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-4">
        {/* Travel Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-warning text-white d-flex justify-content-between align-items-center">
              <div>
                <FaPlane className="me-2" />
                <span>Travel</span>
              </div>
              <span className="badge bg-light text-warning">
                {dashboardData.travel.booked} / {dashboardData.travel.total}
              </span>
            </Card.Header>
            <Card.Body>
              <h5 className="card-title">Travel Status</h5>
              
              {dashboardData.travel.total > 0 ? (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Booked</span>
                    <span>{dashboardData.travel.total > 0 ? Math.round((dashboardData.travel.booked / dashboardData.travel.total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar
                    variant="success"
                    now={dashboardData.travel.total > 0 ? (dashboardData.travel.booked / dashboardData.travel.total) * 100 : 0}
                    className="mb-3"
                  />

                  <div className="d-flex justify-content-between mb-1">
                    <span>Pending</span>
                    <span>{dashboardData.travel.total > 0 ? Math.round((dashboardData.travel.pending / dashboardData.travel.total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar
                    variant="warning"
                    now={dashboardData.travel.total > 0 ? (dashboardData.travel.pending / dashboardData.travel.total) * 100 : 0}
                  />
                  
                  <div className="text-center mt-4">
                    <div className="row">
                      <div className="col-6">
                        <div className="h4 mb-0 text-success">{dashboardData.travel.booked}</div>
                        <small className="text-muted">Booked</small>
                      </div>
                      <div className="col-6">
                        <div className="h4 mb-0 text-warning">{dashboardData.travel.pending}</div>
                        <small className="text-muted">Pending</small>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-0">No travel arrangements required</p>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="warning" 
                size="sm"
                onClick={() => navigateTo('/travel/list')}
                className="w-100 text-white"
              >
                Manage Travel
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        {/* Accommodation Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
              <div>
                <FaBed className="me-2" />
                <span>Accommodation</span>
              </div>
              <span className="badge bg-light text-danger">
                {dashboardData.accommodation.booked} / {dashboardData.accommodation.total}
              </span>
            </Card.Header>
            <Card.Body>
              <h5 className="card-title">Accommodation Status</h5>
              
              {dashboardData.accommodation.total > 0 ? (
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Booked</span>
                    <span>{dashboardData.accommodation.total > 0 ? Math.round((dashboardData.accommodation.booked / dashboardData.accommodation.total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar
                    variant="success"
                    now={dashboardData.accommodation.total > 0 ? (dashboardData.accommodation.booked / dashboardData.accommodation.total) * 100 : 0}
                    className="mb-3"
                  />

                  <div className="d-flex justify-content-between mb-1">
                    <span>Pending</span>
                    <span>{dashboardData.accommodation.total > 0 ? Math.round((dashboardData.accommodation.pending / dashboardData.accommodation.total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar
                    variant="warning"
                    now={dashboardData.accommodation.total > 0 ? (dashboardData.accommodation.pending / dashboardData.accommodation.total) * 100 : 0}
                  />
                  
                  <div className="text-center mt-4">
                    <div className="row">
                      <div className="col-6">
                        <div className="h4 mb-0 text-success">{dashboardData.accommodation.booked}</div>
                        <small className="text-muted">Booked</small>
                      </div>
                      <div className="col-6">
                        <div className="h4 mb-0 text-warning">{dashboardData.accommodation.pending}</div>
                        <small className="text-muted">Pending</small>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-0">No accommodation arrangements required</p>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="danger" 
                size="sm"
                onClick={() => navigateTo('/accommodation/list')}
                className="w-100"
              >
                Manage Accommodation
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-dark text-white">
              <span>Quick Actions</span>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2} sm={4} xs={6} className="mb-3">
                  <Button 
                    variant="outline-primary" 
                    className="w-100"
                    onClick={() => navigateTo('/events/create')}
                  >
                    <FaCalendarAlt className="mb-2" size={24} />
                    <div>Create Event</div>
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3">
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => navigateTo('/sub-events/create')}
                  >
                    <FaCalendarDay className="mb-2" size={24} />
                    <div>Add Sub-Event</div>
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3">
                  <Button 
                    variant="outline-info" 
                    className="w-100"
                    onClick={() => navigateTo('/guests/create')}
                  >
                    <FaUsers className="mb-2" size={24} />
                    <div>Add Guest</div>
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3">
                  <Button 
                    variant="outline-success" 
                    className="w-100"
                    onClick={() => navigateTo('/rsvps/manage')}
                  >
                    <FaEnvelopeOpenText className="mb-2" size={24} />
                    <div>Manage RSVPs</div>
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3">
                  <Button 
                    variant="outline-warning" 
                    className="w-100"
                    onClick={() => navigateTo('/travel/manage')}
                  >
                    <FaPlane className="mb-2" size={24} />
                    <div>Manage Travel</div>
                  </Button>
                </Col>
                <Col md={2} sm={4} xs={6} className="mb-3">
                  <Button 
                    variant="outline-danger" 
                    className="w-100"
                    onClick={() => navigateTo('/accommodation/manage')}
                  >
                    <FaBed className="mb-2" size={24} />
                    <div>Manage Stay</div>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClientDashboard;
