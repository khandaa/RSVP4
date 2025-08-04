import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Form, InputGroup, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaSort, FaPlus, FaBuilding } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { employeeAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('department_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['customer_admin']);
  
  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        // Build query params for filtering by customer if not admin
        const params = {};
        if (!isAdmin && currentUser?.customer_id) {
          params.customer_id = currentUser.customer_id;
        }
        
        const response = await employeeAPI.getDepartments(params);
        setDepartments(response.data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        toast.error('Failed to load departments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDepartments();
  }, [isAdmin, currentUser]);

  // Handle department deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department? Any teams or employees associated with this department will be unassigned.')) {
      try {
        await employeeAPI.deleteDepartment(id);
        setDepartments(departments.filter(dept => dept.department_id !== id));
        toast.success('Department deleted successfully');
      } catch (error) {
        console.error('Failed to delete department:', error);
        toast.error('Failed to delete department. Please try again.');
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

  // Filter and sort departments
  const filteredDepartments = departments
    .filter(department => {
      const searchMatch = 
        (department.department_name && department.department_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (department.department_description && department.department_description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return searchMatch;
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
        <h2>Department Management</h2>
        {(isAdmin || isCustomerAdmin) && (
          <Link to="/departments/create">
            <Button variant="primary">
              <FaPlus className="me-2" /> Create Department
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
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
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
              {filteredDepartments.length === 0 ? (
                <div className="text-center my-5">
                  <p>No departments found. Create a department to get started.</p>
                  <Link to="/departments/create">
                    <Button variant="primary">Create Department</Button>
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('department_name')} style={{ cursor: 'pointer' }}>
                          Department Name <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('manager_first_name')} style={{ cursor: 'pointer' }}>
                          Department Manager <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('customer_name')} style={{ cursor: 'pointer' }}>
                          Customer <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('department_status')} style={{ cursor: 'pointer' }}>
                          Status <FaSort className="ms-1" />
                        </th>
                        <th>Teams</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDepartments.map((department) => (
                        <tr key={department.department_id}>
                          <td>
                            <Link to={`/departments/${department.department_id}`} className="text-decoration-none">
                              {department.department_name}
                            </Link>
                          </td>
                          <td>
                            {department.manager_first_name ? 
                              `${department.manager_first_name} ${department.manager_last_name || ''}` : 
                              'Not assigned'}
                          </td>
                          <td>{department.customer_name || 'Unknown'}</td>
                          <td>
                            <Badge bg={department.department_status === 'Active' ? 'success' : 'secondary'}>
                              {department.department_status || 'Unknown'}
                            </Badge>
                          </td>
                          <td>
                            <Link to={`/departments/${department.department_id}`} className="btn btn-sm btn-outline-primary">
                              <FaBuilding className="me-1" /> View Teams
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Link to={`/departments/${department.department_id}/edit`}>
                                <Button variant="outline-primary" size="sm">
                                  <FaEdit />
                                </Button>
                              </Link>
                              {(isAdmin || isCustomerAdmin) && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => handleDelete(department.department_id)}
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

export default DepartmentList;
