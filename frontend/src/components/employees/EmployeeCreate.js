import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { employeeAPI, customerAPI, teamAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['Customer Admin']);
  const isEditing = !!id;
  const title = isEditing ? 'Edit Employee' : 'Create Employee';

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    customer_id: currentUser?.customer_id || '',
    department_id: '',
    team_id: '',
    status: 'Active'
  });

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);
  
  // Data for dropdowns
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);

  // Validation state
  const [validated, setValidated] = useState(false);
  const [view, setView] = useState('form'); // 'form' or 'table'
  const [tableData, setTableData] = useState([{
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    team_id: '',
    status: 'Active'
  }]);

  const handleTableChange = (index, field, value) => {
    const newTableData = [...tableData];
    newTableData[index][field] = value;
    setTableData(newTableData);
  };

  const addTableRow = () => {
    setTableData([...tableData, {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: '',
      team_id: '',
      status: 'Active'
    }]);
  };

  const removeTableRow = (index) => {
    const newTableData = [...tableData];
    newTableData.splice(index, 1);
    setTableData(newTableData);
  };

  const handleTableSubmit = async () => {
    setLoading(true);
    try {
      const promises = tableData.map(row => employeeAPI.createEmployee(row));
      await Promise.all(promises);
      toast.success(`${tableData.length} employees created successfully!`);
      navigate('/employees/list');
    } catch (error) {
      console.error('Failed to save employees:', error);
      toast.error(error.response?.data?.error || 'Failed to save employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data for dropdowns and employee if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [];
        
        if (isAdmin) {
          // Only admins can select customer
          promises.push(customerAPI.getCustomers());
        }
        
        promises.push(employeeAPI.getDepartments());
        
        const params = {};
        if (!isAdmin && currentUser?.customer_id) {
          params.customer_id = currentUser.customer_id;
        }
        promises.push(teamAPI.getTeams(params));

        if (isEditing) {
          promises.push(employeeAPI.getEmployee(id));
        }

        const responses = await Promise.all(promises);
        
        let responseIndex = 0;
        
        if (isAdmin) {
          setCustomers(responses[responseIndex++].data);
        }
        
        setDepartments(responses[responseIndex++].data);
        setTeams(responses[responseIndex++].data);
        
        if (isEditing) {
          const employeeData = responses[responseIndex].data;
          setFormData({
            first_name: employeeData.first_name || '',
            last_name: employeeData.last_name || '',
            email: employeeData.email || '',
            phone: employeeData.phone || '',
            customer_id: employeeData.customer_id || currentUser?.customer_id || '',
            department_id: employeeData.department_id || '',
            team_id: employeeData.team_id || '',
            status: employeeData.status || 'Active'
          });
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

  // Handle department change to filter teams
  useEffect(() => {
    if (formData.department_id) {
      // Filter teams based on department
      const fetchTeamsByDepartment = async () => {
        try {
          const params = { department_id: formData.department_id };
          const response = await teamAPI.getTeams(params);
          setTeams(response.data);
        } catch (error) {
          console.error('Failed to fetch teams by department:', error);
        }
      };
      
      fetchTeamsByDepartment();
    }
  }, [formData.department_id]);

  // Handle team change to fetch team members
  useEffect(() => {
    if (formData.team_id) {
      // Fetch team members
      const fetchTeamMembers = async () => {
        try {
          const response = await teamAPI.getTeamMembers(formData.team_id);
          setTeamMembers(response.data);
        } catch (error) {
          console.error('Failed to fetch team members:', error);
        }
      };
      
      fetchTeamMembers();
    }
  }, [formData.team_id]);

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
        await employeeAPI.updateEmployee(id, formData);
        toast.success('Employee updated successfully!');
      } else {
        await employeeAPI.createEmployee(formData);
        toast.success('Employee created successfully!');
      }
      navigate('/employees/list');
    } catch (error) {
      console.error('Failed to save employee:', error);
      toast.error(error.response?.data?.error || 'Failed to save employee. Please try again.');
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
        <div>
          <Button variant={view === 'form' ? 'primary' : 'outline-primary'} onClick={() => setView('form')} className="me-2">Form View</Button>
          <Button variant={view === 'table' ? 'primary' : 'outline-primary'} onClick={() => setView('table')}>Table View</Button>
        </div>
        <Button variant="outline-secondary" onClick={() => navigate('/employees/list')}>
          Back to Employees
        </Button>
      </div>

      {view === 'form' ? (
        <Card className="shadow-sm">
          <Card.Body>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name *</Form.Label>
                    <Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    <Form.Control.Feedback type="invalid">First name is required</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name *</Form.Label>
                    <Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                    <Form.Control.Feedback type="invalid">Last name is required</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                    <Form.Control.Feedback type="invalid">Please enter a valid email address</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                {isAdmin && (
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Customer *</Form.Label>
                      <Form.Select name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                        <option value="">Select Customer</option>
                        {customers.map(customer => <option key={customer.customer_id} value={customer.customer_id}>{customer.customer_name}</option>)}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">Please select a customer</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                )}
                <Col md={isAdmin ? 4 : 6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Select name="department_id" value={formData.department_id} onChange={handleChange}>
                      <option value="">Select Department</option>
                      {departments.filter(dept => isAdmin || dept.customer_id === parseInt(formData.customer_id) || dept.customer_id === parseInt(currentUser?.customer_id)).map(department => <option key={department.department_id} value={department.department_id}>{department.department_name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={isAdmin ? 4 : 6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Team</Form.Label>
                    <Form.Select name="team_id" value={formData.team_id} onChange={handleChange}>
                      <option value="">Select Team</option>
                      {teams.filter(team => isAdmin || team.customer_id === parseInt(formData.customer_id) || team.customer_id === parseInt(currentUser?.customer_id)).map(team => <option key={team.team_id} value={team.team_id}>{team.team_name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select name="status" value={formData.status} onChange={handleChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end mt-4">
                <Button variant="secondary" className="me-2" onClick={() => navigate('/employees/list')} disabled={loading}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update Employee' : 'Create Employee'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>First Name *</th>
                    <th>Last Name *</th>
                    <th>Email *</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Team</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      <td><Form.Control type="text" value={row.first_name} onChange={(e) => handleTableChange(index, 'first_name', e.target.value)} required /></td>
                      <td><Form.Control type="text" value={row.last_name} onChange={(e) => handleTableChange(index, 'last_name', e.target.value)} required /></td>
                      <td><Form.Control type="email" value={row.email} onChange={(e) => handleTableChange(index, 'email', e.target.value)} required /></td>
                      <td><Form.Control type="tel" value={row.phone} onChange={(e) => handleTableChange(index, 'phone', e.target.value)} /></td>
                      <td>
                        <Form.Select value={row.department_id} onChange={(e) => handleTableChange(index, 'department_id', e.target.value)}>
                          <option value="">Select Department</option>
                          {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Select value={row.team_id} onChange={(e) => handleTableChange(index, 'team_id', e.target.value)}>
                          <option value="">Select Team</option>
                          {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Select value={row.status} onChange={(e) => handleTableChange(index, 'status', e.target.value)}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="On Leave">On Leave</option>
                        </Form.Select>
                      </td>
                      <td><Button variant="danger" onClick={() => removeTableRow(index)}>X</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={addTableRow}>Add Row</Button>
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" className="me-2" onClick={() => navigate('/employees/list')} disabled={loading}>Cancel</Button>
              <Button variant="primary" onClick={handleTableSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save All'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default EmployeeCreate;
