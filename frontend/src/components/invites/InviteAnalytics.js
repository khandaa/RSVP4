import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaChartLine,
  FaWhatsapp,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaReply,
  FaUsers,
  FaCalendar,
  FaPhone,
  FaEnvelope,
  FaDownload
} from 'react-icons/fa';
import { inviteAPI } from '../../services/api';

const InviteAnalytics = () => {
  const { versionId } = useParams();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [versionId]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await inviteAPI.getAnalytics(versionId);
      setAnalytics(response.data.analytics);
      setDistributions(response.data.distributions || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
      navigate('/invites');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredDistributions = () => {
    let filtered = [...distributions];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(dist =>
        `${dist.guest_first_name} ${dist.guest_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dist.phone_number?.includes(searchTerm) ||
        dist.guest_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(dist => dist.delivery_status === statusFilter);
    }

    return filtered;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'sent': { class: 'bg-primary', icon: FaClock, text: 'Sent' },
      'delivered': { class: 'bg-success', icon: FaCheckCircle, text: 'Delivered' },
      'failed': { class: 'bg-danger', icon: FaTimesCircle, text: 'Failed' },
      'read': { class: 'bg-info', icon: FaEye, text: 'Read' },
      'responded': { class: 'bg-warning', icon: FaReply, text: 'Responded' }
    };

    const badge = badges[status] || badges['sent'];
    const IconComponent = badge.icon;

    return (
      <span className={`badge ${badge.class} d-flex align-items-center gap-1`}>
        <IconComponent size={12} />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  const calculateDeliveryRate = () => {
    if (analytics?.total_sent === 0) return 0;
    return Math.round((analytics?.total_delivered / analytics?.total_sent) * 100);
  };

  const calculateFailureRate = () => {
    if (analytics?.total_sent === 0) return 0;
    return Math.round((analytics?.total_failed / analytics?.total_sent) * 100);
  };

  const exportData = () => {
    const csvData = distributions.map(dist => ({
      'Guest Name': `${dist.guest_first_name} ${dist.guest_last_name}`,
      'Phone Number': dist.phone_number,
      'Email': dist.guest_email || '',
      'Delivery Status': dist.delivery_status,
      'Sent At': formatDate(dist.sent_at),
      'Read At': formatDate(dist.read_at),
      'Responded At': formatDate(dist.responded_at)
    }));

    // Simple CSV export
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invite-analytics-${analytics?.invite_name}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  if (!analytics) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">Analytics not found</h4>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/invites')}
        >
          Back to Invites
        </button>
      </div>
    );
  }

  const filteredDistributions = getFilteredDistributions();

  return (
    <div className="glass-bg min-vh-100 p-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-secondary me-3"
              onClick={() => navigate('/invites')}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-dark fw-bold mb-0">
                <FaChartLine className="me-2" />
                Invite Analytics
              </h2>
              <p className="text-muted mb-0">{analytics.invite_name} - {analytics.invite_title}</p>
            </div>
          </div>
          <button
            className="btn btn-outline-primary glass-btn"
            onClick={exportData}
            disabled={distributions.length === 0}
          >
            <FaDownload className="me-2" />
            Export Data
          </button>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-card text-center">
              <div className="card-body">
                <FaWhatsapp size={32} className="text-success mb-2" />
                <h4 className="fw-bold text-primary">{analytics.total_sent}</h4>
                <p className="text-muted mb-0">Total Sent</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-card text-center">
              <div className="card-body">
                <FaCheckCircle size={32} className="text-success mb-2" />
                <h4 className="fw-bold text-success">{analytics.total_delivered}</h4>
                <p className="text-muted mb-0">Delivered ({calculateDeliveryRate()}%)</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-card text-center">
              <div className="card-body">
                <FaTimesCircle size={32} className="text-danger mb-2" />
                <h4 className="fw-bold text-danger">{analytics.total_failed}</h4>
                <p className="text-muted mb-0">Failed ({calculateFailureRate()}%)</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-card text-center">
              <div className="card-body">
                <FaEye size={32} className="text-info mb-2" />
                <h4 className="fw-bold text-info">{analytics.total_read}</h4>
                <p className="text-muted mb-0">Read</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Details */}
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="card glass-card">
              <div className="card-header">
                <h5 className="card-title mb-0">Invite Details</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Version:</strong> {analytics.version_number}</p>
                    <p><strong>Created:</strong> {formatDate(analytics.created_at)}</p>
                    {analytics.last_sent_at && (
                      <p><strong>Last Sent:</strong> {formatDate(analytics.last_sent_at)}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-primary mb-2">{analytics.invite_title}</h6>
                    <div className="bg-light rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      <small style={{ whiteSpace: 'pre-wrap' }}>
                        {analytics.invite_text || 'No text content'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card glass-card">
              <div className="card-header">
                <h6 className="card-title mb-0">Status Distribution</h6>
              </div>
              <div className="card-body">
                <div className="mb-2 d-flex justify-content-between">
                  <span className="text-muted">Sent:</span>
                  <span className="fw-medium">{analytics.total_sent}</span>
                </div>
                <div className="mb-2 d-flex justify-content-between">
                  <span className="text-muted">Delivered:</span>
                  <span className="fw-medium text-success">{analytics.total_delivered}</span>
                </div>
                <div className="mb-2 d-flex justify-content-between">
                  <span className="text-muted">Failed:</span>
                  <span className="fw-medium text-danger">{analytics.total_failed}</span>
                </div>
                <div className="mb-2 d-flex justify-content-between">
                  <span className="text-muted">Read:</span>
                  <span className="fw-medium text-info">{analytics.total_read}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Responded:</span>
                  <span className="fw-medium text-warning">{analytics.total_responded}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Details */}
        <div className="card glass-card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <FaUsers className="me-2" />
                Delivery Details ({filteredDistributions.length} of {distributions.length})
              </h5>
            </div>
          </div>
          <div className="card-body">
            {/* Filters */}
            <div className="row mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="read">Read</option>
                  <option value="responded">Responded</option>
                </select>
              </div>
            </div>

            {/* Distribution Table */}
            {filteredDistributions.length === 0 ? (
              <div className="text-center py-4">
                <FaUsers size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No delivery records found</h5>
                <p className="text-muted">
                  {distributions.length === 0
                    ? 'No invites have been sent yet'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Sent At</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDistributions.map(dist => (
                      <tr key={dist.distribution_id}>
                        <td>
                          <div className="fw-medium">
                            {dist.guest_first_name} {dist.guest_last_name}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <div className="d-flex align-items-center mb-1">
                              <FaPhone className="text-success me-2" size={12} />
                              <small>{formatPhoneNumber(dist.phone_number)}</small>
                            </div>
                            {dist.guest_email && (
                              <div className="d-flex align-items-center">
                                <FaEnvelope className="text-info me-2" size={12} />
                                <small>{dist.guest_email}</small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(dist.delivery_status)}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaCalendar className="text-muted me-2" size={12} />
                            <small>{formatDate(dist.sent_at)}</small>
                          </div>
                        </td>
                        <td>
                          <small>{formatDate(dist.updated_at)}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteAnalytics;