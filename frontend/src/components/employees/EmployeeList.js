import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Form, InputGroup, Dropdown, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaFilter, FaSort, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { employeeAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('first_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['customer_admin']);
  
  // Fetch employees and departments on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Build query params for filtering by customer if not admin
        const params = {};
        if (!isAdmin && currentUser?.customer_id) {
          params.customer_id = currentUser.customer_id;
        }
        
        const [employeesResponse, departmentsResponse] = await Promise.all([
          employeeAPI.getEmployees(params),
          employeeAPI.getDepartments()
        ]);
        
        setEmployees(employeesResponse.data);
        setDepartments(departmentsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load employees. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAdmin, currentUser]);

  // Handle employee deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.deleteEmployee(id);
        setEmployees(employees.filter(employee => employee.employee_id !== id));
        toast.success('Employee deleted successfully');
      } catch (error) {
        console.error('Failed to delete employee:', error);
        toast.error('Failed to delete employee. Please try again.');
      }
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle department filter
  const handleDepartmentFilter = (departmentId) => {
    setFilterDepartment(departmentId);
  };

  // Filter and sort employees
  const filteredEmployees = employees
    .filter(employee => {
      const searchMatch = 
        (employee.first_name && employee.first_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (employee.last_name && employee.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const departmentMatch = filterDepartment ? employee.department_id === filterDepartment : true;
      
      return searchMatch && departmentMatch;
    })
    .sort((a, b) => {
      if (!a[sortField]) return 1;
      if (!b[sortField]) return -1;
      
      const comparison = String(a[sortField]).localeCompare(String(b[sortField]));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Employee Management</h2>
        {(isAdmin || isCustomerAdmin) && (
          <Link to="/employees/create">
            <Button variant="primary">
              <FaPlus className="me-2" /> Add Employee
            </Button>
          </Link>
        )}
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  <FaFilter className="me-2" />
                  {filterDepartment ? 
                    departments.find(d => d.department_id === filterDepartment)?.department_name || 'Department' 
                    : 'Filter by Department'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleDepartmentFilter('')}>All Departments</Dropdown.Item>
                  {departments.map((department) => (
                    <Dropdown.Item 
                      key={department.department_id} 
                      onClick={() => handleDepartmentFilter(department.department_id)}
                    >
                      {department.department_name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {filteredEmployees.length === 0 ? (
                <div className="text-center my-5">
                  <p>No employees found. Add some employees to get started.</p>
                  <Link to="/employees/create">
                    <Button variant="primary">Add Employee</Button>
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('first_name')} style={{ cursor: 'pointer' }}>
                          Name <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                          Email <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('department_name')} style={{ cursor: 'pointer' }}>
                          Department <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('team_name')} style={{ cursor: 'pointer' }}>
                          Team <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                          Status <FaSort className="ms-1" />
                        </th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.employee_id}>
                          <td>
                            <Link to={`/employees/${employee.employee_id}`} className="text-decoration-none">
                              {employee.first_name} {employee.last_name}
                            </Link>
                          </td>
                          <td>{employee.email}</td>
                          <td>{employee.department_name || 'Unassigned'}</td>
                          <td>{employee.team_name || 'Unassigned'}</td>
                          <td>
                            <Badge bg={employee.status === 'Active' ? 'success' : 'secondary'}>
                              {employee.status || 'Unknown'}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Link to={`/employees/${employee.employee_id}/edit`}>
                                <Button variant="outline-primary" size="sm">
                                  <FaEdit />
                                </Button>
                              </Link>
                              {(isAdmin || isCustomerAdmin) && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => handleDelete(employee.employee_id)}
                                >
                                  <FaTrash />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
