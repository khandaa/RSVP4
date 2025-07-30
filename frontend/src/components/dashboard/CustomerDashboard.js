import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Table } from 'react-bootstrap';
import { FaUserTie, FaCalendarAlt, FaUsers, FaUserFriends } from 'react-icons/fa';
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
    employees: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get the customer ID associated with this admin
        const userResponse = await axios.get(`/api/users/${currentUser.user_id}`);
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
        
        // Fetch active events for this customer's clients
        let allEvents = [];
        for (const client of clientsResponse.data) {
          const eventsResponse = await axios.get(`/api/events?client_id=${client.client_id}&status=active`);
          allEvents = [...allEvents, ...eventsResponse.data.map(event => ({...event, client_name: client.client_name}))];
        }
        
        // Fetch teams associated with this customer
        const teamsResponse = await axios.get(`/api/teams?customer_id=${customerId}`);
        
        // Fetch employees (users) associated with this customer
        const employeesResponse = await axios.get(`/api/users?customer_id=${customerId}`);
        
        setDashboardData({
          clients: clientsResponse.data || [],
          events: allEvents || [],
          teams: teamsResponse.data || [],
          employees: employeesResponse.data || []
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
                <span>Clients</span>
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
                      dashboardData.clients.map((client) => (
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
                <span>Active Events</span>
              </div>
              <span className="badge bg-light text-success">{dashboardData.events.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.events.length > 0 ? (
                      dashboardData.events.map((event) => (
                        <tr key={event.event_id}>
                          <td>{event.event_name}</td>
                          <td>{event.client_name}</td>
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
                        <td colSpan="4" className="text-center">No active events found</td>
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
        {/* Teams Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
              <div>
                <FaUsers className="me-2" />
                <span>Customer Teams</span>
              </div>
              <span className="badge bg-light text-info">{dashboardData.teams.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Members</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.teams.length > 0 ? (
                      dashboardData.teams.map((team) => (
                        <tr key={team.team_id}>
                          <td>{team.team_name}</td>
                          <td>{team.member_count || 0}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-info"
                              onClick={() => navigateTo(`/teams/${team.team_id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">No teams found</td>
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
                onClick={() => navigateTo('/teams')}
                className="w-100 text-white"
              >
                Manage Teams
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        {/* Employees Card */}
        <Col lg={6} md={6} sm={12} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-warning text-white d-flex justify-content-between align-items-center">
              <div>
                <FaUserFriends className="me-2" />
                <span>Customer Employees</span>
              </div>
              <span className="badge bg-light text-warning">{dashboardData.employees.length}</span>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.employees.length > 0 ? (
                      dashboardData.employees.map((employee) => (
                        <tr key={employee.user_id}>
                          <td>{`${employee.first_name} ${employee.last_name}`}</td>
                          <td>{employee.role || 'Employee'}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-warning"
                              onClick={() => navigateTo(`/users/${employee.user_id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">No employees found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Button 
                variant="warning" 
                size="sm"
                onClick={() => navigateTo('/users')}
                className="w-100 text-white"
              >
                Manage Employees
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
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerDashboard;
