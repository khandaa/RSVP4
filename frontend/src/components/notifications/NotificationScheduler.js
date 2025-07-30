import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaClock,
  FaCalendarAlt,
  FaEnvelope,
  FaSms,
  FaWhatsapp,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaEye,
  FaPlay,
  FaPause,
  FaStop,
  FaSave,
  FaTimes,
  FaHistory,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaSpinner,
  FaUsers,
  FaUser,
  FaRedo,
  FaCalendarCheck,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarPlus,
  FaBell,
  FaChartLine,
  FaCog,
  FaListAlt
} from 'react-icons/fa';

const NotificationScheduler = () => {
  const [schedules, setSchedules] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  const [scheduleForm, setScheduleForm] = useState({
    schedule_name: '',
    schedule_type: 'one_time',
    notification_type: 'email',
    template_id: '',
    event_id: '',
    recipient_type: 'all',
    recipient_list: [],
    trigger_type: 'datetime',
    trigger_datetime: '',
    trigger_offset_days: 0,
    trigger_offset_hours: 0,
    trigger_reference: 'event_start',
    recurrence_pattern: 'daily',
    recurrence_interval: 1,
    recurrence_end_date: '',
    max_occurrences: '',
    timezone: 'UTC',
    priority: 'normal',
    is_active: true,
    send_conditions: {},
    schedule_description: '',
    tags: ''
  });

  const scheduleTypes = [
    { value: 'one_time', label: 'One-time Notification' },
    { value: 'recurring', label: 'Recurring Notification' },
    { value: 'event_triggered', label: 'Event-triggered' },
    { value: 'drip_campaign', label: 'Drip Campaign' }
  ];

  const notificationTypes = [
    { value: 'email', label: 'Email', icon: FaEnvelope },
    { value: 'sms', label: 'SMS', icon: FaSms },
    { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp }
  ];

  const triggerTypes = [
    { value: 'datetime', label: 'Specific Date & Time' },
    { value: 'offset', label: 'Relative to Event' },
    { value: 'condition', label: 'When Condition Met' }
  ];

  const triggerReferences = [
    { value: 'event_start', label: 'Event Start Date' },
    { value: 'event_end', label: 'Event End Date' },
    { value: 'rsvp_deadline', label: 'RSVP Deadline' },
    { value: 'registration_date', label: 'Guest Registration' },
    { value: 'checkin_date', label: 'Accommodation Check-in' },
    { value: 'checkout_date', label: 'Accommodation Check-out' }
  ];

  const recurrencePatterns = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom Pattern' }
  ];

  const recipientTypes = [
    { value: 'all', label: 'All Guests' },
    { value: 'event', label: 'Event Guests' },
    { value: 'rsvp_pending', label: 'RSVP Pending' },
    { value: 'rsvp_confirmed', label: 'RSVP Confirmed' },
    { value: 'rsvp_declined', label: 'RSVP Declined' },
    { value: 'vip_guests', label: 'VIP Guests' },
    { value: 'no_response', label: 'No Response Yet' },
    { value: 'custom', label: 'Custom Selection' }
  ];

  const scheduleStatuses = [
    'Active', 'Paused', 'Completed', 'Cancelled', 'Failed', 'Pending'
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low Priority' },
    { value: 'normal', label: 'Normal Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [
        schedulesRes,
        campaignsRes,
        eventsRes,
        templatesRes
      ] = await Promise.all([
        fetch('/api/notification-schedules', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notification-campaigns', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notification-templates', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const schedulesData = schedulesRes.ok ? await schedulesRes.json() : [];
      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      const templatesData = templatesRes.ok ? await templatesRes.json() : [];

      setSchedules(schedulesData);
      setCampaigns(campaignsData);
      setEvents(eventsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load notification scheduler data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingSchedule 
        ? `/api/notification-schedules/${editingSchedule.schedule_id}`
        : '/api/notification-schedules';
      
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(scheduleForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save notification schedule');
      }

      toast.success(`Schedule ${editingSchedule ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save notification schedule');
    }
  };

  const activateSchedule = async (scheduleId) => {
    try {
      const response = await fetch(`/api/notification-schedules/${scheduleId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to activate schedule');
      }

      toast.success('Schedule activated successfully');
      fetchData();
    } catch (error) {
      console.error('Error activating schedule:', error);
      toast.error('Failed to activate schedule');
    }
  };

  const pauseSchedule = async (scheduleId) => {
    try {
      const response = await fetch(`/api/notification-schedules/${scheduleId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to pause schedule');
      }

      toast.success('Schedule paused successfully');
      fetchData();
    } catch (error) {
      console.error('Error pausing schedule:', error);
      toast.error('Failed to pause schedule');
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const response = await fetch(`/api/notification-schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      toast.success('Schedule deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const duplicateSchedule = (schedule) => {
    setScheduleForm({
      ...schedule,
      schedule_name: `${schedule.schedule_name} (Copy)`,
      schedule_id: undefined,
      status: 'Pending',
      is_active: false
    });
    setEditingSchedule(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setScheduleForm({
      schedule_name: '',
      schedule_type: 'one_time',
      notification_type: 'email',
      template_id: '',
      event_id: '',
      recipient_type: 'all',
      recipient_list: [],
      trigger_type: 'datetime',
      trigger_datetime: '',
      trigger_offset_days: 0,
      trigger_offset_hours: 0,
      trigger_reference: 'event_start',
      recurrence_pattern: 'daily',
      recurrence_interval: 1,
      recurrence_end_date: '',
      max_occurrences: '',
      timezone: 'UTC',
      priority: 'normal',
      is_active: true,
      send_conditions: {},
      schedule_description: '',
      tags: ''
    });
    setEditingSchedule(null);
  };

  const openEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({ ...schedule });
    setShowModal(true);
  };

  const previewSchedule = async (schedule) => {
    try {
      const response = await fetch(`/api/notification-schedules/${schedule.schedule_id}/preview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const previewData = await response.json();
        setPreviewData(previewData);
        setShowPreviewModal(true);
      } else {
        toast.error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const calculateNextRun = (schedule) => {
    if (!schedule.is_active || schedule.status !== 'Active') return 'Not scheduled';
    
    // This would be calculated based on the schedule type and current time
    // For now, showing placeholder logic
    if (schedule.trigger_type === 'datetime' && schedule.trigger_datetime) {
      const nextRun = new Date(schedule.trigger_datetime);
      if (nextRun > new Date()) {
        return formatDateTime(schedule.trigger_datetime);
      }
    }
    
    return 'Calculating...';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Pending': return 'bg-primary';
      case 'Paused': return 'bg-warning';
      case 'Completed': return 'bg-info';
      case 'Failed': case 'Cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-danger';
      case 'high': return 'bg-warning';
      case 'normal': return 'bg-primary';
      case 'low': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getTypeIcon = (type) => {
    const typeObj = notificationTypes.find(t => t.value === type);
    return typeObj ? typeObj.icon : FaEnvelope;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const exportSchedules = () => {
    const csvContent = [
      ['Schedule Name', 'Type', 'Notification Type', 'Status', 'Next Run', 'Recipients'].join(','),
      ...schedules.map(schedule => [
        schedule.schedule_name,
        schedule.schedule_type,
        schedule.notification_type,
        schedule.status,
        calculateNextRun(schedule),
        schedule.estimated_recipients || 0
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification_schedules_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilteredSchedules = () => {
    let filtered = schedules.filter(schedule => {
      const matchesSearch = 
        schedule.schedule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.schedule_description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filterStatus || schedule.status === filterStatus;
      const matchesType = !filterType || schedule.notification_type === filterType;
      const matchesEvent = !filterEvent || schedule.event_id?.toString() === filterEvent;
      
      return matchesSearch && matchesStatus && matchesType && matchesEvent;
    });

    // Filter by tab
    const now = new Date();
    switch (activeTab) {
      case 'upcoming':
        return filtered.filter(s => s.status === 'Active' || s.status === 'Pending');
      case 'active':
        return filtered.filter(s => s.status === 'Active' && s.is_active);
      case 'completed':
        return filtered.filter(s => s.status === 'Completed');
      case 'all':
      default:
        return filtered;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading notification scheduler...</p>
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
            <h2 className="text-dark fw-bold mb-0">
              <FaClock className="me-2 text-primary" />
              Notification Scheduler
            </h2>
            <p className="text-muted mb-0">Schedule and automate notification campaigns</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={exportSchedules}
            >
              <FaFileExport className="me-2" />
              Export
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => { resetForm(); setShowModal(true); }}
            >
              <FaPlus className="me-2" />
              Create Schedule
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaPlay className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">{schedules.filter(s => s.status === 'Active').length}</h4>
                <small className="text-muted">Active Schedules</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaClock className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{schedules.filter(s => s.status === 'Pending').length}</h4>
                <small className="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCheckCircle className="text-info mb-2" size={24} />
                <h4 className="text-info mb-1">{schedules.filter(s => s.status === 'Completed').length}</h4>
                <small className="text-muted">Completed</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaRedo className="text-warning mb-2" size={24} />
                <h4 className="text-warning mb-1">{schedules.filter(s => s.schedule_type === 'recurring').length}</h4>
                <small className="text-muted">Recurring</small>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="card glass-card mb-4">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  <FaCalendarPlus className="me-2" />
                  Upcoming ({schedules.filter(s => s.status === 'Active' || s.status === 'Pending').length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'active' ? 'active' : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  <FaPlay className="me-2" />
                  Active ({schedules.filter(s => s.status === 'Active' && s.is_active).length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'completed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('completed')}
                >
                  <FaCheckCircle className="me-2" />
                  Completed ({schedules.filter(s => s.status === 'Completed').length})
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link glass-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  <FaListAlt className="me-2" />
                  All ({schedules.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search schedules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select glass-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {scheduleStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select glass-input"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                >
                  <option value="">All Events</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>
                      {event.event_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-secondary glass-btn w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                    setFilterType('');
                    setFilterEvent('');
                  }}
                >
                  <FaTimes className="me-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedules List */}
        <div className="card glass-card">
          <div className="card-body">
            {getFilteredSchedules().length === 0 ? (
              <div className="text-center py-5">
                <FaClock className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No notification schedules found</h5>
                <p className="text-muted mb-3">Create your first notification schedule to automate communications.</p>
                <button 
                  className="btn btn-primary glass-btn-primary"
                  onClick={() => { resetForm(); setShowModal(true); }}
                >
                  Create Schedule
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Schedule</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Next Run</th>
                      <th>Recipients</th>
                      <th>Performance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredSchedules().map((schedule) => {
                      const TypeIcon = getTypeIcon(schedule.notification_type);
                      return (
                        <tr key={schedule.schedule_id}>
                          <td>
                            <div className="fw-semibold">{schedule.schedule_name}</div>
                            <small className="text-muted">{schedule.schedule_description}</small>
                            <div className="mt-1">
                              <span className={`badge glass-badge ${getPriorityBadgeClass(schedule.priority)}`}>
                                {schedule.priority}
                              </span>
                              {schedule.event_name && (
                                <span className="badge bg-info glass-badge ms-1">
                                  {schedule.event_name}
                                </span>
                              )}
                              {schedule.schedule_type === 'recurring' && (
                                <span className="badge bg-secondary glass-badge ms-1">
                                  <FaRedo className="me-1" size={10} />
                                  {schedule.recurrence_pattern}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <TypeIcon className="me-2 text-primary" />
                              <div>
                                <div className="fw-semibold">{schedule.notification_type.toUpperCase()}</div>
                                <small className="text-muted">{schedule.schedule_type}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge glass-badge ${getStatusBadgeClass(schedule.status)}`}>
                              {schedule.status}
                            </span>
                            {!schedule.is_active && schedule.status === 'Active' && (
                              <div>
                                <small className="text-warning">Paused</small>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold">{calculateNextRun(schedule)}</div>
                            {schedule.trigger_type === 'offset' && (
                              <small className="text-muted">
                                {schedule.trigger_offset_days}d {schedule.trigger_offset_hours}h before {schedule.trigger_reference}
                              </small>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold">{schedule.estimated_recipients || 0}</div>
                            <small className="text-muted">{schedule.recipient_type}</small>
                          </td>
                          <td>
                            {schedule.total_sent > 0 ? (
                              <div>
                                <div className="text-success">
                                  <small>Sent: {schedule.total_sent}</small>
                                </div>
                                <div className="text-info">
                                  <small>Success: {schedule.success_rate || 0}%</small>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">No data</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-info glass-btn"
                                onClick={() => previewSchedule(schedule)}
                                title="Preview"
                              >
                                <FaEye />
                              </button>
                              {schedule.status === 'Pending' && (
                                <button
                                  className="btn btn-sm btn-outline-success glass-btn"
                                  onClick={() => activateSchedule(schedule.schedule_id)}
                                  title="Activate"
                                >
                                  <FaPlay />
                                </button>
                              )}
                              {schedule.status === 'Active' && schedule.is_active && (
                                <button
                                  className="btn btn-sm btn-outline-warning glass-btn"
                                  onClick={() => pauseSchedule(schedule.schedule_id)}
                                  title="Pause"
                                >
                                  <FaPause />
                                </button>
                              )}
                              {schedule.status === 'Active' && !schedule.is_active && (
                                <button
                                  className="btn btn-sm btn-outline-success glass-btn"
                                  onClick={() => activateSchedule(schedule.schedule_id)}
                                  title="Resume"
                                >
                                  <FaPlay />
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-outline-primary glass-btn"
                                onClick={() => openEditSchedule(schedule)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary glass-btn"
                                onClick={() => duplicateSchedule(schedule)}
                                title="Duplicate"
                              >
                                <FaClock />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger glass-btn"
                                onClick={() => deleteSchedule(schedule.schedule_id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Schedule Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaClock className="me-2" />
                    {editingSchedule ? 'Edit Schedule' : 'Create Notification Schedule'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      {/* Basic Information */}
                      <div className="col-md-8">
                        <label className="form-label fw-semibold">Schedule Name *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={scheduleForm.schedule_name}
                          onChange={(e) => setScheduleForm({...scheduleForm, schedule_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Priority</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.priority}
                          onChange={(e) => setScheduleForm({...scheduleForm, priority: e.target.value})}
                        >
                          {priorityLevels.map(priority => (
                            <option key={priority.value} value={priority.value}>{priority.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Schedule Type and Notification Type */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Schedule Type *</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.schedule_type}
                          onChange={(e) => setScheduleForm({...scheduleForm, schedule_type: e.target.value})}
                          required
                        >
                          {scheduleTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Notification Type *</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.notification_type}
                          onChange={(e) => setScheduleForm({...scheduleForm, notification_type: e.target.value})}
                          required
                        >
                          {notificationTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Template and Event */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Template *</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.template_id}
                          onChange={(e) => setScheduleForm({...scheduleForm, template_id: e.target.value})}
                          required
                        >
                          <option value="">Select Template</option>
                          {templates
                            .filter(t => t.template_type === scheduleForm.notification_type)
                            .map(template => (
                              <option key={template.template_id} value={template.template_id}>
                                {template.template_name}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Event (Optional)</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.event_id}
                          onChange={(e) => setScheduleForm({...scheduleForm, event_id: e.target.value})}
                        >
                          <option value="">All Events</option>
                          {events.map(event => (
                            <option key={event.event_id} value={event.event_id}>
                              {event.event_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Recipients */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Recipients *</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.recipient_type}
                          onChange={(e) => setScheduleForm({...scheduleForm, recipient_type: e.target.value})}
                          required
                        >
                          {recipientTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Timezone</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.timezone}
                          onChange={(e) => setScheduleForm({...scheduleForm, timezone: e.target.value})}
                        >
                          {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>

                      {/* Trigger Configuration */}
                      <div className="col-12">
                        <hr />
                        <h6>Trigger Configuration</h6>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Trigger Type *</label>
                        <select
                          className="form-select glass-input"
                          value={scheduleForm.trigger_type}
                          onChange={(e) => setScheduleForm({...scheduleForm, trigger_type: e.target.value})}
                          required
                        >
                          {triggerTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      {scheduleForm.trigger_type === 'datetime' && (
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Trigger Date & Time *</label>
                          <input
                            type="datetime-local"
                            className="form-control glass-input"
                            value={scheduleForm.trigger_datetime}
                            onChange={(e) => setScheduleForm({...scheduleForm, trigger_datetime: e.target.value})}
                            required={scheduleForm.trigger_type === 'datetime'}
                          />
                        </div>
                      )}

                      {scheduleForm.trigger_type === 'offset' && (
                        <>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Reference Point *</label>
                            <select
                              className="form-select glass-input"
                              value={scheduleForm.trigger_reference}
                              onChange={(e) => setScheduleForm({...scheduleForm, trigger_reference: e.target.value})}
                              required={scheduleForm.trigger_type === 'offset'}
                            >
                              {triggerReferences.map(ref => (
                                <option key={ref.value} value={ref.value}>{ref.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">Days Before</label>
                            <input
                              type="number"
                              className="form-control glass-input"
                              value={scheduleForm.trigger_offset_days}
                              onChange={(e) => setScheduleForm({...scheduleForm, trigger_offset_days: parseInt(e.target.value)})}
                              min="0"
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label fw-semibold">Hours Before</label>
                            <input
                              type="number"
                              className="form-control glass-input"
                              value={scheduleForm.trigger_offset_hours}
                              onChange={(e) => setScheduleForm({...scheduleForm, trigger_offset_hours: parseInt(e.target.value)})}
                              min="0"
                              max="23"
                            />
                          </div>
                        </>
                      )}

                      {/* Recurrence Configuration */}
                      {scheduleForm.schedule_type === 'recurring' && (
                        <>
                          <div className="col-12">
                            <hr />
                            <h6>Recurrence Configuration</h6>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold">Recurrence Pattern *</label>
                            <select
                              className="form-select glass-input"
                              value={scheduleForm.recurrence_pattern}
                              onChange={(e) => setScheduleForm({...scheduleForm, recurrence_pattern: e.target.value})}
                              required={scheduleForm.schedule_type === 'recurring'}
                            >
                              {recurrencePatterns.map(pattern => (
                                <option key={pattern.value} value={pattern.value}>{pattern.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold">Interval</label>
                            <input
                              type="number"
                              className="form-control glass-input"
                              value={scheduleForm.recurrence_interval}
                              onChange={(e) => setScheduleForm({...scheduleForm, recurrence_interval: parseInt(e.target.value)})}
                              min="1"
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold">End Date (Optional)</label>
                            <input
                              type="date"
                              className="form-control glass-input"
                              value={scheduleForm.recurrence_end_date}
                              onChange={(e) => setScheduleForm({...scheduleForm, recurrence_end_date: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">Max Occurrences (Optional)</label>
                            <input
                              type="number"
                              className="form-control glass-input"
                              value={scheduleForm.max_occurrences}
                              onChange={(e) => setScheduleForm({...scheduleForm, max_occurrences: e.target.value})}
                              min="1"
                            />
                          </div>
                        </>
                      )}

                      {/* Description */}
                      <div className="col-12">
                        <label className="form-label fw-semibold">Description</label>
                        <textarea
                          className="form-control glass-input"
                          rows="3"
                          value={scheduleForm.schedule_description}
                          onChange={(e) => setScheduleForm({...scheduleForm, schedule_description: e.target.value})}
                        />
                      </div>

                      {/* Active Status */}
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={scheduleForm.is_active}
                            onChange={(e) => setScheduleForm({...scheduleForm, is_active: e.target.checked})}
                          />
                          <label className="form-check-label">
                            Activate schedule immediately after creation
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary glass-btn"
                      onClick={() => setShowModal(false)}
                    >
                      <FaTimes className="me-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      {editingSchedule ? 'Update' : 'Create'} Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && previewData && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaEye className="me-2" />
                    Schedule Preview
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPreviewModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">{previewData.schedule_name}</h6>
                    </div>
                    <div className="card-body">
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <strong>Type:</strong> {previewData.schedule_type}
                        </div>
                        <div className="col-md-6">
                          <strong>Notification:</strong> {previewData.notification_type}
                        </div>
                        <div className="col-md-6">
                          <strong>Recipients:</strong> {previewData.estimated_recipients}
                        </div>
                        <div className="col-md-6">
                          <strong>Next Run:</strong> {calculateNextRun(previewData)}
                        </div>
                      </div>
                      <div className="border rounded p-3">
                        <h6>Template Preview:</h6>
                        <div dangerouslySetInnerHTML={{ __html: previewData.template_preview }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary glass-btn"
                    onClick={() => setShowPreviewModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationScheduler;