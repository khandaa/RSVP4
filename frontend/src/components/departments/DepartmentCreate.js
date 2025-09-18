import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Card, Row, Col, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { employeeAPI, customerAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DepartmentCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['Customer Admin']);
  const isEditing = !!id;
  const title = isEditing ? 'Edit Department' : 'Create Department';

  // Form state
  const [formData, setFormData] = useState({
    department_name: '',
    department_description: '',
    customer_id: currentUser?.customer_id || '',
    department_manager_id: '',
    department_status: 'Active',
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

  // Fetch data for dropdowns and department if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [];
        
        if (isAdmin) {
          // Only admins can select customer
          promises.push(customerAPI.getCustomers());
        }
        
        // If editing, fetch department data first
        if (isEditing) {
          promises.push(employeeAPI.getDepartment(id));
        }

        const responses = await Promise.all(promises);
        
        let responseIndex = 0;
        let customerIdToUse = currentUser?.customer_id;
        
        if (isAdmin) {
          setCustomers(responses[responseIndex].data);
          responseIndex++;
        }
        
        if (isEditing) {
          const departmentData = responses[responseIndex].data;
          customerIdToUse = departmentData.customer_id || currentUser?.customer_id;
          
          setFormData({
            department_name: departmentData.department_name || '',
            department_description: departmentData.department_description || '',
            customer_id: departmentData.customer_id || currentUser?.customer_id || '',
            department_manager_id: departmentData.department_manager_id || '',
            department_status: departmentData.department_status || 'Active',
            notes: departmentData.notes || ''
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
        await employeeAPI.updateDepartment(id, formData);
        toast.success('Department updated successfully!');
      } else {
        const dataToSend = { ...formData };
        if (!isAdmin) {
          dataToSend.customer_id = currentUser.customer_id;
        }
        await employeeAPI.createDepartment(dataToSend);
        toast.success('Department created successfully!');
      }
      navigate('/departments/list');
    } catch (error) {
      console.error('Failed to save department:', error);
      toast.error(error.response?.data?.error || 'Failed to save department. Please try again.');
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
        <Button variant="outline-secondary" onClick={() => navigate('/departments/list')}>
          Back to Departments
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="department_name"
                    value={formData.department_name}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Department name is required
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
                      name="department_status"
                      value={formData.department_status}
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
                  <Form.Label>Department Manager</Form.Label>
                  <Form.Select
                    name="department_manager_id"
                    value={formData.department_manager_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Department Manager</option>
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
                      name="department_status"
                      value={formData.department_status}
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
              <Form.Label>Department Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="department_description"
                value={formData.department_description}
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
                onClick={() => navigate('/departments/list')}
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
                ) : isEditing ? 'Update Department' : 'Create Department'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DepartmentCreate;
