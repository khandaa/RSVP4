import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Table } from 'react-bootstrap';
import { FaUserTie, FaCalendarAlt, FaUsers, FaUserFriends, FaUserCheck, FaTruck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    clients: [],
    events: [],
    teams: [],
    employees: [],
    guests: [],
    logistics: []
  });

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get the customer ID associated with this admin
        const userResponse = await axios.get('/api/comprehensive-crud/users/profile');
        const userDetails = userResponse.data;
        
        // Assuming customer_id is stored in user's metadata or can be derived from email domain
        // This will depend on your implementation - you might need to modify this part
        const customerEmail = userDetails.email;
        const customerResponse = await axios.get(`/api/customers?email=${encodeURIComponent(customerEmail)}`);
        const customerId = customerResponse.data[0]?.customer_id;
        
        if (!customerId) {
          console.error('Could not determine customer ID for this user');
          setLoading(false);
          return;
        }
        
        // Fetch clients associated with this customer
        const clientsResponse = await axios.get(`/api/clients?customer_id=${customerId}`);
        
        // Fetch in-progress and planned events for this customer's clients
        let allEvents = [];
        for (const client of clientsResponse.data || []) {
          try {
            // Fetch In Progress events
            const inProgressResponse = await axios.get(`/api/events?client_id=${client.client_id}&status=In Progress`);
            const inProgressEvents = inProgressResponse.data.map(event => ({...event, client_name: client.client_name}));
            
            // Fetch Planned events
            const plannedResponse = await axios.get(`/api/events?client_id=${client.client_id}&status=Planned`);
            const plannedEvents = plannedResponse.data.map(event => ({...event, client_name: client.client_name}));
            
            // Combine both event types
            allEvents = [...allEvents, ...inProgressEvents, ...plannedEvents];
          } catch (error) {
            console.warn(`Could not fetch events for client ${client.client_id}:`, error);
          }
        }
        
        // Fetch teams associated with this customer
        let teamsData = [];
        try {
          const teamsResponse = await axios.get(`/api/teams?customer_id=${customerId}`);
          teamsData = teamsResponse.data || [];
        } catch (error) {
          console.warn('Could not fetch teams:', error);
        }
        
        // Fetch employees (users) associated with this customer
        let employeesData = [];
        try {
          const employeesResponse = await axios.get(`/api/comprehensive-crud/users?customer_id=${customerId}`);
          employeesData = employeesResponse.data || [];
        } catch (error) {
          console.warn('Could not fetch employees:', error);
        }
        
        // Fetch guests for all events of this customer
        let allGuests = [];
        for (const event of allEvents) {
          try {
            const guestsResponse = await axios.get(`/api/guests?event_id=${event.event_id}`);
            const eventGuests = guestsResponse.data.map(guest => ({...guest, event_name: event.event_name}));
            allGuests = [...allGuests, ...eventGuests];
          } catch (error) {
            console.warn(`Could not fetch guests for event ${event.event_id}:`, error);
          }
        }
        
        // Fetch logistics data (accommodation and travel) for this customer's events
        let logisticsData = [];
        for (const event of allEvents) {
          try {
            // Fetch accommodation data
            const accommodationResponse = await axios.get(`/api/logistics/accommodation?event_id=${event.event_id}`);
            const accommodations = accommodationResponse.data.map(acc => ({...acc, type: 'Accommodation', event_name: event.event_name}));
            
            // Fetch travel data
            const travelResponse = await axios.get(`/api/logistics/travel?event_id=${event.event_id}`);
            const travels = travelResponse.data.map(travel => ({...travel, type: 'Travel', event_name: event.event_name}));
            
            logisticsData = [...logisticsData, ...accommodations, ...travels];
          } catch (error) {
            console.warn(`Could not fetch logistics for event ${event.event_id}:`, error);
          }
        }
        
        setDashboardData({
          clients: clientsResponse.data || [],
          events: allEvents || [],
          teams: teamsData || [],
          employees: employeesData || [],
          guests: allGuests || [],
          logistics: logisticsData || []
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
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
      <h2 className="mb-4">Customer Dashboard</h2>
      
      <Row className="mb-4">
        {/* Clients Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <div>
                <FaUserTie className="me-2" />
                <span>Latest Clients</span>
              </div>
              <span className="badge bg-light text-primary">{dashboardData.clients.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.clients.length > 0 ? (
                      dashboardData.clients
                        .sort((a, b) => new Date(b.created_at || b.client_created_at) - new Date(a.created_at || a.client_created_at))
                        .slice(0, 5)
                        .map((client) => (
                        <tr key={client.client_id}>
                          <td>{client.client_name}</td>
                          <td>
                            <span className={`badge ${client.client_status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                              {client.client_status}
                            </span>
                          </td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => navigateTo(`/clients/${client.client_id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">No clients found</td>
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
                onClick={() => navigateTo('/clients')}
                className="w-100"
              >
                Manage Clients
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        {/* Active Events Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
              <div>
                <FaCalendarAlt className="me-2" />
                <span>Latest Events</span>
              </div>
              <span className="badge bg-light text-success">{dashboardData.events.filter(event => event.event_status === 'Planned' || event.event_status === 'In Progress').length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.events.length > 0 ? (
                      dashboardData.events
                        .filter(event => event.event_status === 'Planned' || event.event_status === 'In Progress')
                        .sort((a, b) => new Date(b.updated_at || b.event_updated_at || b.created_at || b.event_created_at) - new Date(a.updated_at || a.event_updated_at || a.created_at || a.event_created_at))
                        .slice(0, 5)
                        .map((event) => (
                        <tr key={event.event_id}>
                          <td>{event.event_name}</td>
                          <td>{event.client_name}</td>
                          <td>
                            <span className={`badge ${event.event_status === 'In Progress' ? 'bg-warning' : 'bg-primary'}`}>
                              {event.event_status}
                            </span>
                          </td>
                          <td>{new Date(event.event_date).toLocaleDateString()}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-success"
                              onClick={() => navigateTo(`/events/${event.event_id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">No active events found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="success" 
                size="sm"
                onClick={() => navigateTo('/events')}
                className="w-100"
              >
                View All Events
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      
      <Row className="mb-4">
        {/* Guest Management Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
              <div>
                <FaUserCheck className="me-2" />
                <span>Latest Guests</span>
              </div>
              <span className="badge bg-light text-secondary">{dashboardData.guests.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Guest Name</th>
                      <th>Event</th>
                      <th>RSVP Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.guests.length > 0 ? (
                      dashboardData.guests
                        .sort((a, b) => new Date(b.updated_at || b.guest_updated_at || b.created_at || b.guest_created_at) - new Date(a.updated_at || a.guest_updated_at || a.created_at || a.guest_created_at))
                        .slice(0, 5)
                        .map((guest) => (
                        <tr key={`${guest.guest_id}-${guest.event_id || guest.guest_id}`}>
                          <td>{`${guest.guest_first_name} ${guest.guest_last_name}`}</td>
                          <td>{guest.event_name}</td>
                          <td>
                            <span className={`badge ${
                              guest.rsvp_status === 'Confirmed' ? 'bg-success' : 
                              guest.rsvp_status === 'Declined' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {guest.rsvp_status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-secondary"
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
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Row>
                <Col md={6} className="mb-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => navigateTo('/guests')}
                    className="w-100 text-white"
                  >
                    Manage Guests
                  </Button>
                </Col>
                <Col md={6} className="mb-2">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => navigateTo('/guests/import')}
                    className="w-100"
                  >
                    Bulk Upload
                  </Button>
                </Col>
              </Row>
            </Card.Footer>
          </Card>
        </Col>

        {/* Logistics Management Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
              <div>
                <FaTruck className="me-2" />
                <span>Latest Logistics</span>
              </div>
              <span className="badge bg-light text-danger">{dashboardData.logistics.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.logistics.length > 0 ? (
                      dashboardData.logistics
                        .sort((a, b) => new Date(b.updated_at || b.logistics_updated_at || b.created_at || b.logistics_created_at) - new Date(a.updated_at || a.logistics_updated_at || a.created_at || a.logistics_created_at))
                        .slice(0, 5)
                        .map((item, index) => (
                        <tr key={`${item.type}-${index}`}>
                          <td>
                            <span className={`badge ${
                              item.type === 'Accommodation' ? 'bg-info' : 'bg-warning'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td>{item.event_name}</td>
                          <td>
                            <span className={`badge ${
                              item.status === 'Confirmed' ? 'bg-success' : 
                              item.status === 'Cancelled' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {item.status || 'Pending'}
                            </span>
                          </td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-danger"
                              onClick={() => navigateTo(`/logistics/${item.type.toLowerCase()}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No logistics data found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="danger" 
                size="sm"
                onClick={() => navigateTo('/logistics')}
                className="w-100 text-white"
              >
                Manage Logistics
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
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-primary" 
                    className="w-100"
                    onClick={() => navigateTo('/clients/create')}
                  >
                    <FaUserTie className="mb-2" size={24} />
                    <div>Add Client</div>
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-success" 
                    className="w-100"
                    onClick={() => navigateTo('/events/create')}
                  >
                    <FaCalendarAlt className="mb-2" size={24} />
                    <div>Create Event</div>
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-info" 
                    className="w-100"
                    onClick={() => navigateTo('/teams/create')}
                  >
                    <FaUsers className="mb-2" size={24} />
                    <div>Add Team</div>
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-warning" 
                    className="w-100"
                    onClick={() => navigateTo('/users/create')}
                  >
                    <FaUserFriends className="mb-2" size={24} />
                    <div>Add Employee</div>
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => navigateTo('/guests/create')}
                  >
                    <FaUserCheck className="mb-2" size={24} />
                    <div>Add Guest</div>
                  </Button>
                </Col>
                <Col md={3} sm={6} className="mb-3">
                  <Button 
                    variant="outline-danger" 
                    className="w-100"
                    onClick={() => navigateTo('/logistics/dashboard')}
                  >
                    <FaTruck className="mb-2" size={24} />
                    <div>Logistics</div>
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

export default CustomerDashboard;
