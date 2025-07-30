import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaEnvelope,
  FaSms,
  FaWhatsapp,
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaEye,
  FaMousePointer,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaDownload,
  FaFilter,
  FaSearch,
  FaRefresh,
  FaTimes,
  FaFileExport,
  FaPrint,
  FaExpand,
  FaCompress,
  FaPercentage,
  FaTrendUp,
  FaTrendDown,
  FaDollarSign,
  FaCalendarAlt,
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from 'react-icons/fa';

const CommunicationAnalytics = () => {
  const [communicationData, setCommunicationData] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [reportData, setReportData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [reportType, setReportType] = useState('overview');
  const [groupBy, setGroupBy] = useState('channel');
  const [dateRange, setDateRange] = useState('30days');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const channels = [
    { value: 'email', label: 'Email', color: 'primary', icon: FaEnvelope },
    { value: 'sms', label: 'SMS', color: 'success', icon: FaSms },
    { value: 'whatsapp', label: 'WhatsApp', color: 'info', icon: FaWhatsapp }
  ];

  const reportTypes = [
    { value: 'overview', label: 'Performance Overview', icon: FaChartBar },
    { value: 'engagement', label: 'Engagement Analysis', icon: FaEye },
    { value: 'delivery', label: 'Delivery Analysis', icon: FaCheckCircle },
    { value: 'cost', label: 'Cost Analysis', icon: FaDollarSign },
    { value: 'trends', label: 'Trend Analysis', icon: FaChartLine }
  ];

  const groupByOptions = [
    { value: 'channel', label: 'Communication Channel' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'event', label: 'Event' },
    { value: 'date', label: 'Date' },
    { value: 'status', label: 'Delivery Status' }
  ];

  const dateRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const deliveryStatuses = [
    { value: 'sent', label: 'Sent', color: 'primary', icon: FaCheckCircle },
    { value: 'delivered', label: 'Delivered', color: 'success', icon: FaCheckCircle },
    { value: 'opened', label: 'Opened', color: 'info', icon: FaEye },
    { value: 'clicked', label: 'Clicked', color: 'warning', icon: FaMousePointer },
    { value: 'failed', label: 'Failed', color: 'danger', icon: FaTimesCircle },
    { value: 'bounced', label: 'Bounced', color: 'warning', icon: FaExclamationTriangle }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [communicationData, campaigns, events, filterChannel, filterEvent, filterCampaign, reportType, groupBy, dateRange, customDateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [communicationRes, campaignsRes, eventsRes] = await Promise.all([
        fetch('/api/communication-logs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/notification-campaigns', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/events', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const communicationData = communicationRes.ok ? await communicationRes.json() : [];
      const campaignsData = campaignsRes.ok ? await campaignsRes.json() : [];
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];

      setCommunicationData(communicationData);
      setCampaigns(campaignsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load communication data');
      setCommunicationData([]);
      setCampaigns([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = () => {
    let filteredData = communicationData;

    // Apply filters
    if (searchTerm) {
      filteredData = filteredData.filter(item =>
        item.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recipient_phone?.includes(searchTerm) ||
        item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterChannel) {
      filteredData = filteredData.filter(item => item.channel === filterChannel);
    }

    if (filterEvent) {
      filteredData = filteredData.filter(item => item.event_id?.toString() === filterEvent);
    }

    if (filterCampaign) {
      filteredData = filteredData.filter(item => item.campaign_id?.toString() === filterCampaign);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      filteredData = applyDateRangeFilter(filteredData);
    }

    // Generate report data
    const reportData = generateReportData(filteredData);
    setReportData(reportData);
  };

  const applyDateRangeFilter = (data) => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '6months':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = new Date(customDateRange.startDate);
          endDate = new Date(customDateRange.endDate);
        }
        break;
    }

    if (startDate && endDate) {
      return data.filter(item => {
        const itemDate = new Date(item.sent_datetime);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    return data;
  };

  const generateReportData = (filteredData) => {
    const data = {
      totalCommunications: filteredData.length,
      communications: filteredData,
      summary: {},
      groupedData: {},
      engagementMetrics: {},
      deliveryMetrics: {},
      costAnalysis: {},
      trendData: {}
    };

    // Summary statistics
    data.summary = {
      byChannel: channels.reduce((acc, channel) => {
        const channelData = filteredData.filter(item => item.channel === channel.value);
        acc[channel.value] = {
          total: channelData.length,
          delivered: channelData.filter(item => item.status === 'delivered').length,
          opened: channelData.filter(item => item.status === 'opened').length,
          clicked: channelData.filter(item => item.status === 'clicked').length,
          failed: channelData.filter(item => item.status === 'failed').length
        };
        return acc;
      }, {}),
      totalSent: filteredData.length,
      totalDelivered: filteredData.filter(item => item.status === 'delivered').length,
      totalOpened: filteredData.filter(item => item.status === 'opened').length,
      totalClicked: filteredData.filter(item => item.status === 'clicked').length,
      totalFailed: filteredData.filter(item => item.status === 'failed').length
    };

    // Calculate rates
    data.summary.deliveryRate = data.summary.totalSent > 0 ? 
      Math.round((data.summary.totalDelivered / data.summary.totalSent) * 100) : 0;
    data.summary.openRate = data.summary.totalDelivered > 0 ? 
      Math.round((data.summary.totalOpened / data.summary.totalDelivered) * 100) : 0;
    data.summary.clickRate = data.summary.totalOpened > 0 ? 
      Math.round((data.summary.totalClicked / data.summary.totalOpened) * 100) : 0;
    data.summary.failureRate = data.summary.totalSent > 0 ? 
      Math.round((data.summary.totalFailed / data.summary.totalSent) * 100) : 0;

    // Group data based on groupBy option
    data.groupedData = groupCommunicationData(filteredData, groupBy);

    // Engagement metrics
    data.engagementMetrics = generateEngagementMetrics(filteredData);

    // Delivery metrics
    data.deliveryMetrics = generateDeliveryMetrics(filteredData);

    // Cost analysis
    data.costAnalysis = generateCostAnalysis(filteredData);

    // Trend analysis
    data.trendData = generateTrendData(filteredData);

    return data;
  };

  const groupCommunicationData = (data, groupBy) => {
    const grouped = {};

    data.forEach(item => {
      let key;
      switch (groupBy) {
        case 'channel':
          key = item.channel || 'unknown';
          break;
        case 'campaign':
          key = item.campaign_name || 'Direct Communication';
          break;
        case 'event':
          const event = events.find(e => e.event_id === item.event_id);
          key = event?.event_name || 'Unknown Event';
          break;
        case 'date':
          key = new Date(item.sent_datetime).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          break;
        case 'status':
          key = item.status || 'unknown';
          break;
        default:
          key = 'Other';
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  };

  const generateEngagementMetrics = (data) => {
    const metrics = {
      emailEngagement: {},
      smsEngagement: {},
      whatsappEngagement: {},
      bestPerformingCampaigns: [],
      peakEngagementTimes: {}
    };

    // Email engagement
    const emailData = data.filter(item => item.channel === 'email');
    metrics.emailEngagement = {
      totalSent: emailData.length,
      openRate: emailData.length > 0 ? 
        Math.round((emailData.filter(item => item.status === 'opened').length / emailData.length) * 100) : 0,
      clickRate: emailData.filter(item => item.status === 'opened').length > 0 ? 
        Math.round((emailData.filter(item => item.status === 'clicked').length / 
        emailData.filter(item => item.status === 'opened').length) * 100) : 0,
      bounceRate: emailData.length > 0 ? 
        Math.round((emailData.filter(item => item.status === 'bounced').length / emailData.length) * 100) : 0
    };

    // SMS engagement
    const smsData = data.filter(item => item.channel === 'sms');
    metrics.smsEngagement = {
      totalSent: smsData.length,
      deliveryRate: smsData.length > 0 ? 
        Math.round((smsData.filter(item => item.status === 'delivered').length / smsData.length) * 100) : 0,
      clickRate: smsData.filter(item => item.status === 'delivered').length > 0 ? 
        Math.round((smsData.filter(item => item.status === 'clicked').length / 
        smsData.filter(item => item.status === 'delivered').length) * 100) : 0
    };

    // WhatsApp engagement
    const whatsappData = data.filter(item => item.channel === 'whatsapp');
    metrics.whatsappEngagement = {
      totalSent: whatsappData.length,
      deliveryRate: whatsappData.length > 0 ? 
        Math.round((whatsappData.filter(item => item.status === 'delivered').length / whatsappData.length) * 100) : 0,
      readRate: whatsappData.filter(item => item.status === 'delivered').length > 0 ? 
        Math.round((whatsappData.filter(item => item.status === 'opened').length / 
        whatsappData.filter(item => item.status === 'delivered').length) * 100) : 0
    };

    // Best performing campaigns
    const campaignPerformance = {};
    campaigns.forEach(campaign => {
      const campaignData = data.filter(item => item.campaign_id === campaign.campaign_id);
      if (campaignData.length > 0) {
        const engagementRate = campaignData.filter(item => item.status === 'opened' || item.status === 'clicked').length / campaignData.length;
        campaignPerformance[campaign.campaign_name] = {
          total: campaignData.length,
          engagementRate: Math.round(engagementRate * 100),
          channel: campaignData[0]?.channel
        };
      }
    });

    metrics.bestPerformingCampaigns = Object.entries(campaignPerformance)
      .sort(([,a], [,b]) => b.engagementRate - a.engagementRate)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    return metrics;
  };

  const generateDeliveryMetrics = (data) => {
    const metrics = {
      overallDeliveryRate: data.length > 0 ? 
        Math.round((data.filter(item => item.status === 'delivered').length / data.length) * 100) : 0,
      channelDeliveryRates: {},
      failureReasons: {},
      averageDeliveryTime: 0
    };

    // Channel delivery rates
    channels.forEach(channel => {
      const channelData = data.filter(item => item.channel === channel.value);
      metrics.channelDeliveryRates[channel.value] = channelData.length > 0 ? 
        Math.round((channelData.filter(item => item.status === 'delivered').length / channelData.length) * 100) : 0;
    });

    // Failure reasons
    const failedData = data.filter(item => item.status === 'failed');
    const reasons = {};
    failedData.forEach(item => {
      const reason = item.failure_reason || 'Unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    metrics.failureReasons = Object.entries(reasons)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: Math.round((count / failedData.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    return metrics;
  };

  const generateCostAnalysis = (data) => {
    const analysis = {
      totalCost: 0,
      costByChannel: {},
      costPerRecipient: 0,
      costPerEngagement: 0
    };

    // Estimated costs (these would normally come from actual cost data)
    const costPerCommunication = {
      email: 0.01,
      sms: 0.05,
      whatsapp: 0.02
    };

    channels.forEach(channel => {
      const channelData = data.filter(item => item.channel === channel.value);
      const cost = channelData.length * (costPerCommunication[channel.value] || 0);
      analysis.costByChannel[channel.value] = cost;
      analysis.totalCost += cost;
    });

    analysis.costPerRecipient = data.length > 0 ? Math.round((analysis.totalCost / data.length) * 100) / 100 : 0;
    
    const engagements = data.filter(item => item.status === 'opened' || item.status === 'clicked').length;
    analysis.costPerEngagement = engagements > 0 ? Math.round((analysis.totalCost / engagements) * 100) / 100 : 0;

    return analysis;
  };

  const generateTrendData = (data) => {
    // Generate daily trend data for the last 30 days
    const trends = {};
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayData = data.filter(item => {
        const itemDate = new Date(item.sent_datetime);
        return itemDate.toDateString() === date.toDateString();
      });

      trends[dateKey] = {
        total: dayData.length,
        delivered: dayData.filter(item => item.status === 'delivered').length,
        opened: dayData.filter(item => item.status === 'opened').length,
        clicked: dayData.filter(item => item.status === 'clicked').length,
        failed: dayData.filter(item => item.status === 'failed').length
      };
    }

    return trends;
  };

  const exportReport = (format = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const csvData = [
        ['Date', 'Campaign', 'Channel', 'Recipient', 'Status', 'Subject', 'Event', 'Sent Time', 'Delivered Time']
      ];

      reportData.communications.forEach(item => {
        const event = events.find(e => e.event_id === item.event_id);
        csvData.push([
          item.sent_datetime ? new Date(item.sent_datetime).toLocaleDateString() : '',
          item.campaign_name || 'Direct',
          item.channel || '',
          item.recipient_email || item.recipient_phone || '',
          item.status || '',
          item.subject || '',
          event?.event_name || '',
          item.sent_datetime ? new Date(item.sent_datetime).toLocaleTimeString() : '',
          item.delivered_datetime ? new Date(item.delivered_datetime).toLocaleTimeString() : ''
        ]);
      });

      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `communication_analytics_${timestamp}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const exportData = {
        generatedAt: new Date().toISOString(),
        reportType,
        filters: {
          channel: filterChannel,
          event: filterEvent,
          campaign: filterCampaign,
          dateRange,
          searchTerm
        },
        data: reportData
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `communication_analytics_${timestamp}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterChannel('');
    setFilterEvent('');
    setFilterCampaign('');
    setDateRange('30days');
    setCustomDateRange({ startDate: '', endDate: '' });
  };

  const getChannelBadgeClass = (channel) => {
    const channelInfo = channels.find(c => c.value === channel);
    return channelInfo ? `bg-${channelInfo.color}` : 'bg-secondary';
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  };

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading communication analytics...</p>
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
              <FaEnvelope className="me-2 text-primary" />
              Communication Performance Analytics
            </h2>
            <p className="text-muted mb-0">Comprehensive analysis of email, SMS, and WhatsApp communication performance</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={() => fetchData()}
            >
              <FaRefresh className="me-2" />
              Refresh
            </button>
            <div className="dropdown">
              <button 
                className="btn btn-outline-primary glass-btn dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
              >
                <FaFileExport className="me-2" />
                Export
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button className="dropdown-item" onClick={() => exportReport('csv')}>
                    Export as CSV
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => exportReport('json')}>
                    Export as JSON
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={() => window.print()}>
                    <FaPrint className="me-2" />
                    Print Report
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Filters and Report Configuration */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold">Report Type</label>
                <select
                  className="form-select glass-input"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Group By</label>
                <select
                  className="form-select glass-input"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  {groupByOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Channel</label>
                <select
                  className="form-select glass-input"
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                >
                  <option value="">All Channels</option>
                  {channels.map(channel => (
                    <option key={channel.value} value={channel.value}>{channel.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Date Range</label>
                <select
                  className="form-select glass-input"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Event</label>
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
              <div className="col-md-3">
                <label className="form-label fw-semibold">Campaign</label>
                <select
                  className="form-select glass-input"
                  value={filterCampaign}
                  onChange={(e) => setFilterCampaign(e.target.value)}
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Search</label>
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search communications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button 
                  className="btn btn-outline-secondary glass-btn w-100"
                  onClick={clearFilters}
                >
                  <FaTimes className="me-2" />
                  Clear
                </button>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Start Date</label>
                    <input
                      type="date"
                      className="form-control glass-input"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">End Date</label>
                    <input
                      type="date"
                      className="form-control glass-input"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="row g-4 mb-4">
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaEnvelope className="text-primary mb-2" size={24} />
                <h4 className="text-primary mb-1">{reportData.totalCommunications?.toLocaleString() || 0}</h4>
                <small className="text-muted">Total Sent</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaCheckCircle className="text-success mb-2" size={24} />
                <h4 className={`mb-1 ${getPerformanceColor(reportData.summary?.deliveryRate || 0)}`}>
                  {reportData.summary?.deliveryRate || 0}%
                </h4>
                <small className="text-muted">Delivery Rate</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaEye className="text-info mb-2" size={24} />
                <h4 className={`mb-1 ${getPerformanceColor(reportData.summary?.openRate || 0)}`}>
                  {reportData.summary?.openRate || 0}%
                </h4>
                <small className="text-muted">Open Rate</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaMousePointer className="text-warning mb-2" size={24} />
                <h4 className={`mb-1 ${getPerformanceColor(reportData.summary?.clickRate || 0)}`}>
                  {reportData.summary?.clickRate || 0}%
                </h4>
                <small className="text-muted">Click Rate</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaTimesCircle className="text-danger mb-2" size={24} />
                <h4 className="text-danger mb-1">{reportData.summary?.failureRate || 0}%</h4>
                <small className="text-muted">Failure Rate</small>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card glass-card h-100">
              <div className="card-body text-center">
                <FaDollarSign className="text-success mb-2" size={24} />
                <h4 className="text-success mb-1">${reportData.costAnalysis?.totalCost?.toFixed(2) || '0.00'}</h4>
                <small className="text-muted">Total Cost</small>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="card glass-card mb-4">
          <div className="card-header">
            <h5 className="card-title mb-0">
              <FaChartBar className="me-2" />
              Performance by Channel
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              {channels.map(channel => {
                const channelData = reportData.summary?.byChannel?.[channel.value] || {};
                const Icon = channel.icon;
                const deliveryRate = channelData.total > 0 ? 
                  Math.round((channelData.delivered / channelData.total) * 100) : 0;
                const openRate = channelData.delivered > 0 ? 
                  Math.round((channelData.opened / channelData.delivered) * 100) : 0;
                
                return (
                  <div key={channel.value} className="col-md-4 mb-3">
                    <div className="card glass-effect">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <Icon className={`me-2 text-${channel.color}`} size={20} />
                          <h6 className="mb-0">{channel.label}</h6>
                        </div>
                        <div className="row text-center">
                          <div className="col-6">
                            <div className="fw-bold">{channelData.total || 0}</div>
                            <small className="text-muted">Sent</small>
                          </div>
                          <div className="col-6">
                            <div className={`fw-bold ${getPerformanceColor(deliveryRate)}`}>
                              {deliveryRate}%
                            </div>
                            <small className="text-muted">Delivered</small>
                          </div>
                        </div>
                        {channel.value === 'email' && (
                          <div className="row text-center mt-2">
                            <div className="col-6">
                              <div className={`fw-bold ${getPerformanceColor(openRate)}`}>
                                {openRate}%
                              </div>
                              <small className="text-muted">Opened</small>
                            </div>
                            <div className="col-6">
                              <div className="fw-bold text-warning">
                                {channelData.clicked || 0}
                              </div>
                              <small className="text-muted">Clicked</small>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        {reportType === 'trends' && (
          <div className="card glass-card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaChartLine className="me-2" />
                Communication Trends (Last 30 Days)
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Delivered</th>
                      <th>Opened</th>
                      <th>Clicked</th>
                      <th>Failed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.trendData || {}).map(([date, data]) => (
                      <tr key={date}>
                        <td>{date}</td>
                        <td>{data.total}</td>
                        <td className="text-success">{data.delivered}</td>
                        <td className="text-info">{data.opened}</td>
                        <td className="text-warning">{data.clicked}</td>
                        <td className="text-danger">{data.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Best Performing Campaigns */}
        {reportType === 'engagement' && (
          <div className="card glass-card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <FaTrendUp className="me-2" />
                Best Performing Campaigns
              </h5>
            </div>
            <div className="card-body">
              {reportData.engagementMetrics?.bestPerformingCampaigns?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Channel</th>
                        <th>Total Sent</th>
                        <th>Engagement Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.engagementMetrics.bestPerformingCampaigns.map((campaign, index) => (
                        <tr key={index}>
                          <td>{campaign.name}</td>
                          <td>
                            <span className={`badge glass-badge ${getChannelBadgeClass(campaign.channel)}`}>
                              {campaign.channel}
                            </span>
                          </td>
                          <td>{campaign.total}</td>
                          <td>
                            <span className={getPerformanceColor(campaign.engagementRate)}>
                              {campaign.engagementRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3">
                  <FaChartBar className="text-muted mb-2" size={32} />
                  <p className="text-muted">No campaign data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cost Analysis */}
        {reportType === 'cost' && (
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaDollarSign className="me-2" />
                    Cost by Channel
                  </h5>
                </div>
                <div className="card-body">
                  {Object.entries(reportData.costAnalysis?.costByChannel || {}).map(([channel, cost]) => {
                    const channelInfo = channels.find(c => c.value === channel);
                    const Icon = channelInfo?.icon || FaInfoCircle;
                    return (
                      <div key={channel} className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <Icon className={`me-2 text-${channelInfo?.color || 'secondary'}`} />
                          <span>{channelInfo?.label || channel}</span>
                        </div>
                        <span className="fw-bold">${cost.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card glass-card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <FaPercentage className="me-2" />
                    Cost Efficiency
                  </h5>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span>Cost per Recipient</span>
                    <span className="fw-bold">${reportData.costAnalysis?.costPerRecipient || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span>Cost per Engagement</span>
                    <span className="fw-bold">${reportData.costAnalysis?.costPerEngagement || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Total Communications</span>
                    <span className="fw-bold">{reportData.totalCommunications || 0}</span>
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

export default CommunicationAnalytics;