import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { teamAPI, customerAPI, employeeAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TeamCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['customer_admin']);
  const isEditing = !!id;
  const title = isEditing ? 'Edit Team' : 'Create Team';

  // Form state
  const [formData, setFormData] = useState({
    team_name: '',
    team_description: '',
    customer_id: currentUser?.customer_id || '',
    team_leader_id: '',
    team_status: 'Active',
    notes: ''
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  
  // Data for dropdowns
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Validation state
  const [validated, setValidated] = useState(false);

  // Fetch data for dropdowns and team if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [];
        
        if (isAdmin) {
          // Only admins can select customer
          promises.push(customerAPI.getCustomers());
        }
        
        // If editing, fetch team data first
        if (isEditing) {
          promises.push(teamAPI.getTeam(id));
        }

        const responses = await Promise.all(promises);
        
        let responseIndex = 0;
        let customerIdToUse = currentUser?.customer_id;
        
        if (isAdmin) {
          setCustomers(responses[responseIndex].data);
          responseIndex++;
        }
        
        if (isEditing) {
          const teamData = responses[responseIndex].data;
          customerIdToUse = teamData.customer_id || currentUser?.customer_id;
          
          setFormData({
            team_name: teamData.team_name || '',
            team_description: teamData.team_description || '',
            customer_id: teamData.customer_id || currentUser?.customer_id || '',
            team_leader_id: teamData.team_leader_id || '',
            team_status: teamData.team_status || 'Active',
            notes: teamData.notes || ''
          });
        }
        
        // Now fetch employees based on customer ID
        try {
          const params = { customer_id: customerIdToUse };
          const employeeResponse = await employeeAPI.getEmployees(params);
          setEmployees(employeeResponse.data);
        } catch (error) {
          console.error('Failed to fetch employees:', error);
          toast.error('Failed to load employees. Please try again later.');
        }
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load required data. Please try again later.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isAdmin, isEditing, id, currentUser]);

  // Handle customer change to filter employees
  useEffect(() => {
    if (formData.customer_id) {
      const fetchEmployeesByCustomer = async () => {
        try {
          const params = { customer_id: formData.customer_id };
          const response = await employeeAPI.getEmployees(params);
          setEmployees(response.data);
        } catch (error) {
          console.error('Failed to fetch employees by customer:', error);
        }
      };
      
      fetchEmployeesByCustomer();
    }
  }, [formData.customer_id]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setLoading(true);
    try {
      if (isEditing) {
        await teamAPI.updateTeam(id, formData);
        toast.success('Team updated successfully!');
      } else {
        await teamAPI.createTeam(formData);
        toast.success('Team created successfully!');
      }
      navigate('/teams/list');
    } catch (error) {
      console.error('Failed to save team:', error);
      toast.error(error.response?.data?.error || 'Failed to save team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{title}</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/teams/list')}>
          Back to Teams
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Team Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="team_name"
                    value={formData.team_name}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Team name is required
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                {isAdmin ? (
                  <Form.Group className="mb-3">
                    <Form.Label>Customer *</Form.Label>
                    <Form.Select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.customer_id} value={customer.customer_id}>
                          {customer.customer_name}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      Please select a customer
                    </Form.Control.Feedback>
                  </Form.Group>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="team_status"
                      value={formData.team_status}
                      onChange={handleChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                )}
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Team Leader</Form.Label>
                  <Form.Select
                    name="team_leader_id"
                    value={formData.team_leader_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Team Leader</option>
                    {employees
                      .filter(employee => employee.status === 'Active')
                      .map(employee => (
                        <option key={employee.employee_id} value={employee.employee_id}>
                          {employee.first_name} {employee.last_name}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                {isAdmin ? (
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      name="team_status"
                      value={formData.team_status}
                      onChange={handleChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                ) : null}
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>Team Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="team_description"
                value={formData.team_description}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end mt-4">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => navigate('/teams/list')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : isEditing ? 'Update Team' : 'Create Team'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TeamCreate;
