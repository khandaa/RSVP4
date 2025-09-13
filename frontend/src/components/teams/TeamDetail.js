import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Spinner, Table, Modal, Form } from 'react-bootstrap';
import { FaEdit, FaArrowLeft, FaTimes, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { teamAPI, employeeAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['Admin', 'admin', 'full_access']);
  const isCustomerAdmin = hasRole(['customer_admin']);
  const canEdit = isAdmin || isCustomerAdmin;

  const [team, setTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  // Fetch team data and members
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get team details
        const teamResponse = await teamAPI.getTeam(id);
        setTeam(teamResponse.data);
        
        // Get team members
        const membersResponse = await teamAPI.getTeamMembers(id);
        setTeamMembers(membersResponse.data);
        
        // Get available employees not in this team
        const params = { 
          customer_id: teamResponse.data.customer_id 
        };
        
        const employeesResponse = await employeeAPI.getEmployees(params);
        
        // Filter out employees already in the team
        const memberIds = membersResponse.data.map(member => member.employee_id);
        const available = employeesResponse.data.filter(
          employee => !memberIds.includes(employee.employee_id)
        );
        
        setAvailableEmployees(available);
      } catch (error) {
        console.error('Failed to fetch team details:', error);
        toast.error('Failed to load team details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handle team member addition
  const handleAddMember = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee to add to the team');
      return;
    }

    setAddingMember(true);
    try {
      await teamAPI.addTeamMember(id, {
        employee_id: selectedEmployee,
        is_team_leader: isTeamLeader
      });
      
      // Refresh team members list
      const membersResponse = await teamAPI.getTeamMembers(id);
      setTeamMembers(membersResponse.data);
      
      // Update available employees
      setAvailableEmployees(
        availableEmployees.filter(emp => emp.employee_id !== parseInt(selectedEmployee))
      );
      
      // If added as team leader and there was no previous leader or updating the leader
      if (isTeamLeader) {
        const updatedTeam = { ...team, team_leader_id: selectedEmployee };
        setTeam(updatedTeam);
      }
      
      toast.success('Team member added successfully');
      setShowAddMemberModal(false);
      setSelectedEmployee('');
      setIsTeamLeader(false);
    } catch (error) {
      console.error('Failed to add team member:', error);
      toast.error('Failed to add team member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  // Handle team member removal
  const handleRemoveMember = async (employeeId) => {
    if (window.confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await teamAPI.removeTeamMember(id, employeeId);
        
        // Get the employee that was removed
        const removedEmployee = teamMembers.find(
          member => member.employee_id === employeeId
        );
        
        // Update team members
        setTeamMembers(teamMembers.filter(member => member.employee_id !== employeeId));
        
        // Add back to available employees
        if (removedEmployee) {
          setAvailableEmployees([...availableEmployees, removedEmployee]);
        }
        
        // If removing the team leader, update team data
        if (team.team_leader_id === employeeId) {
          const updatedTeam = { ...team, team_leader_id: null };
          setTeam(updatedTeam);
        }
        
        toast.success('Team member removed successfully');
      } catch (error) {
        console.error('Failed to remove team member:', error);
        toast.error('Failed to remove team member. Please try again.');
      }
    }
  };

  // Handle making a member the team leader
  const handleSetTeamLeader = async (employeeId) => {
    if (window.confirm('Are you sure you want to set this member as team leader?')) {
      try {
        // Update team leader in the team
        await teamAPI.updateTeam(id, { team_leader_id: employeeId });
        
        // Update local state
        const updatedTeam = { ...team, team_leader_id: employeeId };
        setTeam(updatedTeam);
        
        // Update team members to reflect new leader
        const updatedMembers = teamMembers.map(member => ({
          ...member,
          is_team_leader: member.employee_id === employeeId
        }));
        setTeamMembers(updatedMembers);
        
        toast.success('Team leader updated successfully');
      } catch (error) {
        console.error('Failed to update team leader:', error);
        toast.error('Failed to update team leader. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          Team not found or has been deleted.
        </div>
        <Button variant="outline-primary" onClick={() => navigate('/teams/list')}>
          Back to Teams List
        </Button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Team Details</h2>
        <div>
          <Button 
            variant="outline-secondary" 
            className="me-2"
            onClick={() => navigate('/teams/list')}
          >
            <FaArrowLeft className="me-2" /> Back to List
          </Button>
          {canEdit && (
            <Link to={`/teams/${id}/edit`}>
              <Button variant="primary">
                <FaEdit className="me-2" /> Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h4>{team.team_name}</h4>
              <Badge bg={team.team_status === 'Active' ? 'success' : 'secondary'}>
                {team.team_status}
              </Badge>
            </Card.Header>
            <Card.Body>
              {team.team_description && (
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p>{team.team_description}</p>
                </div>
              )}
              
              <div className="mb-3">
                <strong>Customer:</strong>
                <p>{team.customer_name || 'Not assigned'}</p>
              </div>
              
              <div className="mb-3">
                <strong>Team Leader:</strong>
                <p>
                  {team.leader_first_name ? (
                    <Link to={`/employees/${team.team_leader_id}`} className="text-decoration-none">
                      {team.leader_first_name} {team.leader_last_name}
                    </Link>
                  ) : 'Not assigned'}
                </p>
              </div>
              
              {team.created_at && (
                <div className="mb-3">
                  <strong>Created:</strong>
                  <p>{new Date(team.created_at).toLocaleDateString()}</p>
                </div>
              )}
              
              {team.notes && (
                <div className="mt-3">
                  <strong>Notes:</strong>
                  <p>{team.notes}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Team Members</h5>
              {canEdit && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => setShowAddMemberModal(true)}
                  disabled={availableEmployees.length === 0}
                >
                  <FaUserPlus className="me-2" /> Add Member
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {teamMembers.length === 0 ? (
                <div className="text-center my-4">
                  <p>No team members yet.</p>
                  {canEdit && (
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setShowAddMemberModal(true)}
                      disabled={availableEmployees.length === 0}
                    >
                      Add Members
                    </Button>
                  )}
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => (
                      <tr key={member.employee_id}>
                        <td>
                          <Link to={`/employees/${member.employee_id}`} className="text-decoration-none">
                            {member.first_name} {member.last_name}
                            {member.is_team_leader && (
                              <Badge bg="primary" className="ms-2">Team Leader</Badge>
                            )}
                          </Link>
                        </td>
                        <td>{member.email}</td>
                        <td>{member.position || 'N/A'}</td>
                        <td>
                          <Badge bg={member.status === 'Active' ? 'success' : member.status === 'On Leave' ? 'warning' : 'secondary'}>
                            {member.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {canEdit && !member.is_team_leader && (
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={() => handleSetTeamLeader(member.employee_id)}
                                title="Set as Team Leader"
                              >
                                Set as Leader
                              </Button>
                            )}
                            {canEdit && (
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => handleRemoveMember(member.employee_id)}
                                title="Remove from Team"
                              >
                                <FaTimes />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Team Member Modal */}
      <Modal show={showAddMemberModal} onHide={() => setShowAddMemberModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Team Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableEmployees.length === 0 ? (
            <p>No more employees available to add to this team.</p>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Employee</Form.Label>
                <Form.Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Choose an employee</option>
                  {availableEmployees.map(employee => (
                    <option key={employee.employee_id} value={employee.employee_id}>
                      {employee.first_name} {employee.last_name} - {employee.email}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Set as Team Leader"
                  checked={isTeamLeader}
                  onChange={(e) => setIsTeamLeader(e.target.checked)}
                />
                {team.team_leader_id && isTeamLeader && (
                  <div className="text-danger small mt-1">
                    This will replace the current team leader.
                  </div>
                )}
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMember} 
            disabled={!selectedEmployee || addingMember}
          >
            {addingMember ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Adding...
              </>
            ) : 'Add Member'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TeamDetail;
