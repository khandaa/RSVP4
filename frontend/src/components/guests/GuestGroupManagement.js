import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaUsers,
  FaUserFriends,
  FaSave,
  FaTimes,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';

const GuestGroupManagement = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [clientFilter, setClientFilter] = useState('all');
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    group_name: '',
    group_description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    fetchGroups();
  }, [clientFilter]);

  useEffect(() => {
    filterAndSortGroups();
  }, [groups, searchTerm, sortConfig]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      let url = '/api/comprehensive-crud/guest-groups';
      if (clientFilter !== 'all') {
        url += `?client_id=${clientFilter}`;
      }
      const [groupsResponse, clientsResponse] = await Promise.all([
        fetch(url, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (groupsResponse.ok) {
        const data = await groupsResponse.json();
        setGroups(data || []);
      } else {
        setGroups([]);
      }

      if (clientsResponse.ok) {
        const data = await clientsResponse.json();
        setClients(data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
      setGroups([]);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortGroups = () => {
    let filtered = [...groups];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.group_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredGroups(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    }
    return <FaSort />;
  };

  const resetForm = () => {
    setFormData({
      group_name: '',
      group_description: ''
    });
    setErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (group) => {
    setSelectedGroup(group);
    setFormData({
      group_name: group.group_name || '',
      group_description: group.group_description || ''
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleDelete = (group) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.group_name.trim()) {
      newErrors.group_name = 'Group name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isEdit = false) => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEdit 
        ? `/api/comprehensive-crud/guest-groups/${selectedGroup.guest_group_id}`
        : '/api/comprehensive-crud/guest-groups';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ group_name: formData.group_name, group_description: formData.group_description })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} group`);
      }

      toast.success(`Group ${isEdit ? 'updated' : 'created'} successfully`);
      fetchGroups();
      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} group:`, error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} group`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/comprehensive-crud/guest-groups/${selectedGroup.guest_group_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      toast.success('Group deleted successfully');
      fetchGroups();
      setShowDeleteModal(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };


  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-dark fw-bold mb-0">Guest Groups</h2>
            <p className="text-muted">Manage guest groups for better organization</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={handleCreate}
            >
              <FaPlus className="me-2" />
              Create Group
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select glass-input"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="all">All Clients</option>
                  {clients.map(client => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.client_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 text-end">
                <div className="text-muted small">
                  <FaUsers className="me-1" />
                  {filteredGroups.length} of {groups.length} groups
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Table */}
        <div className="table-container glass-table">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('guest_group_id')}
                  style={{ cursor: 'pointer' }}
                >
                  ID {getSortIcon('guest_group_id')}
                </th>
                <th 
                  scope="col" 
                  className="sortable" 
                  onClick={() => handleSort('group_name')}
                  style={{ cursor: 'pointer' }}
                >
                  Group Name {getSortIcon('group_name')}
                </th>
                <th scope="col">Description
                </th>
                <th scope="col">Members</th>
                <th
                  scope="col"
                  className="sortable"
                  onClick={() => handleSort('created_at')}
                  style={{ cursor: 'pointer' }}
                >
                  Created {getSortIcon('created_at')}
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="text-muted">
                      {searchTerm
                        ? 'No groups match your search'
                        : 'No groups found. Create your first group!'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.guest_group_id}>
                    <td>#{group.guest_group_id}</td>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center">
                        <FaUserFriends className="text-primary me-2" />
                        <Link to={`/guests/groups/${group.guest_group_id}`}>{group.group_name}</Link>
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px' }}>
                        {group.group_description ? (
                          group.group_description.length > 50
                            ? `${group.group_description.substring(0, 50)}...`
                            : group.group_description
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info glass-badge">
                        {group.member_count || 0} members
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {group.created_at ? new Date(group.created_at).toLocaleDateString() : '-'}
                      </small>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-info glass-btn"
                          onClick={() => navigate(`/guests?groupId=${group.group_id}`)}
                          title="View Members"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary glass-btn"
                          onClick={() => handleEdit(group)}
                          title="Edit Group"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger glass-btn"
                          onClick={() => handleDelete(group)}
                          title="Delete Group"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040 
            }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">Create New Group</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowCreateModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Group Name *
                        </label>
                        <input
                          type="text"
                          className={`form-control glass-input ${errors.group_name ? 'is-invalid' : ''}`}
                          placeholder="Enter group name"
                          value={formData.group_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
                        />
                        {errors.group_name && (
                          <div className="invalid-feedback">{errors.group_name}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Description
                        </label>
                        <textarea
                          className="form-control glass-input"
                          placeholder="Enter group description"
                          rows="3"
                          value={formData.group_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, group_description: e.target.value }))}
                        />
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowCreateModal(false)}
                      disabled={isSubmitting}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary glass-btn-primary"
                      onClick={() => handleSubmit(false)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Create Group
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {showEditModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040 
            }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Group</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowEditModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Group Name *
                        </label>
                        <input
                          type="text"
                          className={`form-control glass-input ${errors.group_name ? 'is-invalid' : ''}`}
                          placeholder="Enter group name"
                          value={formData.group_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
                        />
                        {errors.group_name && (
                          <div className="invalid-feedback">{errors.group_name}</div>
                        )}
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Description
                        </label>
                        <textarea
                          className="form-control glass-input"
                          placeholder="Enter group description"
                          rows="3"
                          value={formData.group_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, group_description: e.target.value }))}
                        />
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowEditModal(false)}
                      disabled={isSubmitting}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary glass-btn-primary"
                      onClick={() => handleSubmit(true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Update Group
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040 
            }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content glass-modal">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowDeleteModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete group <strong>{selectedGroup?.group_name}</strong>?</p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> This will remove the group association from all members, but the guests themselves will not be deleted.
                    </div>
                    <div className="alert alert-danger">
                      <small>This action cannot be undone.</small>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger glass-btn-danger"
                      onClick={confirmDelete}
                    >
                      Delete Group
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestGroupManagement;