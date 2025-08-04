import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Form, InputGroup, Dropdown, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaFilter, FaSort, FaPlus, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { teamAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('team_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const { hasRole, currentUser } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['customer_admin']);
  
  // Fetch teams on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        // Build query params for filtering by customer if not admin
        const params = {};
        if (!isAdmin && currentUser?.customer_id) {
          params.customer_id = currentUser.customer_id;
        }
        
        const response = await teamAPI.getTeams(params);
        setTeams(response.data);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        toast.error('Failed to load teams. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, [isAdmin, currentUser]);

  // Handle team deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team? Team members will not be deleted but will be unassigned from this team.')) {
      try {
        await teamAPI.deleteTeam(id);
        setTeams(teams.filter(team => team.team_id !== id));
        toast.success('Team deleted successfully');
      } catch (error) {
        console.error('Failed to delete team:', error);
        toast.error('Failed to delete team. Please try again.');
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

  // Filter and sort teams
  const filteredTeams = teams
    .filter(team => {
      const searchMatch = 
        (team.team_name && team.team_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (team.team_description && team.team_description.toLowerCase().includes(searchTerm.toLowerCase()));
      
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
        <h2>Team Management</h2>
        {(isAdmin || isCustomerAdmin) && (
          <Link to="/teams/create">
            <Button variant="primary">
              <FaPlus className="me-2" /> Create Team
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
                  placeholder="Search teams..."
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
              {filteredTeams.length === 0 ? (
                <div className="text-center my-5">
                  <p>No teams found. Create a team to get started.</p>
                  <Link to="/teams/create">
                    <Button variant="primary">Create Team</Button>
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('team_name')} style={{ cursor: 'pointer' }}>
                          Team Name <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('leader_first_name')} style={{ cursor: 'pointer' }}>
                          Team Leader <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('customer_name')} style={{ cursor: 'pointer' }}>
                          Customer <FaSort className="ms-1" />
                        </th>
                        <th onClick={() => handleSort('team_status')} style={{ cursor: 'pointer' }}>
                          Status <FaSort className="ms-1" />
                        </th>
                        <th>Members</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeams.map((team) => (
                        <tr key={team.team_id}>
                          <td>
                            <Link to={`/teams/${team.team_id}`} className="text-decoration-none">
                              {team.team_name}
                            </Link>
                          </td>
                          <td>
                            {team.leader_first_name ? 
                              `${team.leader_first_name} ${team.leader_last_name || ''}` : 
                              'Not assigned'}
                          </td>
                          <td>{team.customer_name || 'Unknown'}</td>
                          <td>
                            <Badge bg={team.team_status === 'Active' ? 'success' : 'secondary'}>
                              {team.team_status || 'Unknown'}
                            </Badge>
                          </td>
                          <td>
                            <Link to={`/teams/${team.team_id}`} className="btn btn-sm btn-outline-primary">
                              <FaUsers className="me-1" /> View Members
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Link to={`/teams/${team.team_id}/edit`}>
                                <Button variant="outline-primary" size="sm">
                                  <FaEdit />
                                </Button>
                              </Link>
                              {(isAdmin || isCustomerAdmin) && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => handleDelete(team.team_id)}
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

export default TeamList;
