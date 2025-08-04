import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Spinner, ListGroup } from 'react-bootstrap';
import { FaEdit, FaArrowLeft, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt, FaBuilding, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { employeeAPI, teamAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['customer_admin']);
  const canEdit = isAdmin || isCustomerAdmin;

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);

  // Fetch employee data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const employeeResponse = await employeeAPI.getEmployee(id);
        setEmployee(employeeResponse.data);
        
        // If employee has a team_id, get the team details
        if (employeeResponse.data.team_id) {
          const teamsResponse = await teamAPI.getTeamMembers(employeeResponse.data.team_id);
          setTeams(teamsResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch employee details:', error);
        toast.error('Failed to load employee details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          Employee not found or has been deleted.
        </div>
        <Button variant="outline-primary" onClick={() => navigate('/employees/list')}>
          Back to Employees List
        </Button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Employee Details</h2>
        <div>
          <Button 
            variant="outline-secondary" 
            className="me-2"
            onClick={() => navigate('/employees/list')}
          >
            <FaArrowLeft className="me-2" /> Back to List
          </Button>
          {canEdit && (
            <Link to={`/employees/${id}/edit`}>
              <Button variant="primary">
                <FaEdit className="me-2" /> Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h4>{employee.first_name} {employee.last_name}</h4>
              <div>
                <Badge bg={employee.status === 'Active' ? 'success' : employee.status === 'On Leave' ? 'warning' : 'secondary'}>
                  {employee.status}
                </Badge>
                {employee.position && (
                  <Badge bg="info" className="ms-2">
                    {employee.position}
                  </Badge>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <div className="d-flex">
                        <div className="me-3">
                          <FaEnvelope className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Email</div>
                          <div>{employee.email || 'Not provided'}</div>
                        </div>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex">
                        <div className="me-3">
                          <FaPhone className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Phone</div>
                          <div>{employee.phone || 'Not provided'}</div>
                        </div>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex">
                        <div className="me-3">
                          <FaCalendar className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Joined</div>
                          <div>
                            {employee.employment_date 
                              ? new Date(employee.employment_date).toLocaleDateString() 
                              : 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Col>

                <Col md={6}>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <div className="d-flex">
                        <div className="me-3">
                          <FaBuilding className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Department</div>
                          <div>{employee.department_name || 'Not assigned'}</div>
                        </div>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex">
                        <div className="me-3">
                          <FaUsers className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Team</div>
                          <div>
                            {employee.team_name ? (
                              <Link to={`/teams/${employee.team_id}`} className="text-decoration-none">
                                {employee.team_name}
                              </Link>
                            ) : 'Not assigned'}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <div className="d-flex">
                        <div className="me-3">
                          <FaMapMarkerAlt className="text-muted" />
                        </div>
                        <div>
                          <div className="text-muted small">Location</div>
                          <div>
                            {employee.city && employee.state 
                              ? `${employee.city}, ${employee.state}`
                              : employee.city || employee.state || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
              </Row>

              {employee.address && (
                <Card.Text className="mt-3">
                  <strong>Address:</strong><br />
                  {employee.address}<br />
                  {employee.city && employee.state && `${employee.city}, ${employee.state} `}
                  {employee.postal_code}<br />
                  {employee.country}
                </Card.Text>
              )}

              {employee.notes && (
                <div className="mt-3">
                  <strong>Notes:</strong>
                  <Card.Text className="border-top pt-2 mt-2">
                    {employee.notes}
                  </Card.Text>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {employee.team_id && teams.length > 0 && (
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Team Members</h5>
              </Card.Header>
              <ListGroup variant="flush">
                {teams.map(member => (
                  <ListGroup.Item key={member.employee_id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <Link to={`/employees/${member.employee_id}`} className="text-decoration-none">
                        {member.first_name} {member.last_name}
                      </Link>
                      {member.is_team_leader && (
                        <Badge bg="primary" className="ms-2">Team Leader</Badge>
                      )}
                    </div>
                    <Badge bg={member.status === 'Active' ? 'success' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          )}

          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Customer Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Customer:</strong>
                <div>
                  {employee.customer_name || 'Not assigned'}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDetail;
