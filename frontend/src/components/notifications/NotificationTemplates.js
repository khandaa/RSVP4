import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaEnvelope,
  FaSms,
  FaWhatsapp,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaCopy,
  FaEye,
  FaSave,
  FaTimes,
  FaCode,
  FaImage,
  FaLink,
  FaBold,
  FaItalic,
  FaUnderline,
  FaList,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaUndo,
  FaRedo,
  FaSpellCheck,
  FaDownload,
  FaUpload
} from 'react-icons/fa';

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [templateForm, setTemplateForm] = useState({
    template_name: '',
    template_type: 'email',
    template_category: 'event',
    subject: '',
    content: '',
    variables: '',
    is_active: true,
    description: '',
    sender_name: '',
    sender_email: '',
    reply_to: '',
    tags: ''
  });

  const templateTypes = [
    { value: 'email', label: 'Email', icon: FaEnvelope },
    { value: 'sms', label: 'SMS', icon: FaSms },
    { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp }
  ];

  const templateCategories = [
    { value: 'event', label: 'Event Notifications' },
    { value: 'rsvp', label: 'RSVP Related' },
    { value: 'logistics', label: 'Logistics & Travel' },
    { value: 'reminder', label: 'Reminders' },
    { value: 'confirmation', label: 'Confirmations' },
    { value: 'welcome', label: 'Welcome Messages' },
    { value: 'update', label: 'Updates' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'system', label: 'System Messages' }
  ];

  // Common template variables
  const commonVariables = [
    '{{guest_first_name}}',
    '{{guest_last_name}}',
    '{{guest_email}}',
    '{{event_name}}',
    '{{event_date}}',
    '{{event_time}}',
    '{{event_location}}',
    '{{venue_name}}',
    '{{venue_address}}',
    '{{rsvp_link}}',
    '{{rsvp_deadline}}',
    '{{accommodation_details}}',
    '{{travel_details}}',
    '{{special_instructions}}',
    '{{contact_email}}',
    '{{contact_phone}}',
    '{{organization_name}}',
    '{{event_dress_code}}',
    '{{event_agenda}}',
    '{{parking_instructions}}'
  ];

  // Predefined templates
  const predefinedTemplates = [
    {
      name: 'Event Invitation',
      type: 'email',
      category: 'event',
      subject: 'You\'re Invited: {{event_name}}',
      content: `Dear {{guest_first_name}},

You are cordially invited to {{event_name}}.

Event Details:
Date: {{event_date}}
Time: {{event_time}}
Venue: {{venue_name}}
Address: {{venue_address}}

Please confirm your attendance by clicking the link below:
{{rsvp_link}}

We look forward to seeing you there!

Best regards,
{{organization_name}}`
    },
    {
      name: 'RSVP Confirmation',
      type: 'email',
      category: 'rsvp',
      subject: 'RSVP Confirmed: {{event_name}}',
      content: `Dear {{guest_first_name}},

Thank you for confirming your attendance at {{event_name}}.

Event Details:
Date: {{event_date}}
Time: {{event_time}}
Venue: {{venue_name}}

We have received your RSVP and look forward to welcoming you to this special event.

Best regards,
{{organization_name}}`
    },
    {
      name: 'Event Reminder',
      type: 'sms',
      category: 'reminder',
      subject: '',
      content: 'Reminder: {{event_name}} is tomorrow at {{event_time}} at {{venue_name}}. Don\'t forget! {{organization_name}}'
    },
    {
      name: 'Travel Information',
      type: 'email',
      category: 'logistics',
      subject: 'Travel Information: {{event_name}}',
      content: `Dear {{guest_first_name}},

Here are your travel details for {{event_name}}:

{{travel_details}}

Accommodation:
{{accommodation_details}}

If you have any questions, please contact us at {{contact_email}}.

Safe travels!
{{organization_name}}`
    }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notification-templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        // If no templates exist, create some default ones
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load notification templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingTemplate 
        ? `/api/notification-templates/${editingTemplate.template_id}`
        : '/api/notification-templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateForm)
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      toast.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/notification-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const resetForm = () => {
    setTemplateForm({
      template_name: '',
      template_type: 'email',
      template_category: 'event',
      subject: '',
      content: '',
      variables: '',
      is_active: true,
      description: '',
      sender_name: '',
      sender_email: '',
      reply_to: '',
      tags: ''
    });
    setEditingTemplate(null);
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({ ...template });
    setShowModal(true);
  };

  const duplicateTemplate = (template) => {
    setTemplateForm({
      ...template,
      template_name: `${template.template_name} (Copy)`,
      template_id: undefined
    });
    setEditingTemplate(null);
    setShowModal(true);
  };

  const insertVariable = (variable) => {
    const content = templateForm.content;
    const newContent = content + variable;
    setTemplateForm({ ...templateForm, content: newContent });
  };

  const loadPredefinedTemplate = (template) => {
    setTemplateForm({
      template_name: template.name,
      template_type: template.type,
      template_category: template.category,
      subject: template.subject,
      content: template.content,
      variables: '',
      is_active: true,
      description: `Predefined ${template.name} template`,
      sender_name: '',
      sender_email: '',
      reply_to: '',
      tags: 'predefined'
    });
  };

  const previewTemplate = (template) => {
    // Replace variables with sample data for preview
    const sampleData = {
      '{{guest_first_name}}': 'John',
      '{{guest_last_name}}': 'Doe',
      '{{guest_email}}': 'john.doe@example.com',
      '{{event_name}}': 'Annual Conference 2024',
      '{{event_date}}': 'March 15, 2024',
      '{{event_time}}': '9:00 AM',
      '{{event_location}}': 'Grand Convention Center',
      '{{venue_name}}': 'Grand Convention Center',
      '{{venue_address}}': '123 Main Street, New York, NY 10001',
      '{{rsvp_link}}': 'https://example.com/rsvp/abc123',
      '{{rsvp_deadline}}': 'March 10, 2024',
      '{{organization_name}}': 'Your Organization',
      '{{contact_email}}': 'events@yourorg.com',
      '{{contact_phone}}': '+1 (555) 123-4567'
    };

    let previewContent = template.content;
    let previewSubject = template.subject || '';

    Object.entries(sampleData).forEach(([variable, value]) => {
      previewContent = previewContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      previewSubject = previewSubject.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    setPreviewTemplate({
      ...template,
      subject: previewSubject,
      content: previewContent
    });
    setShowPreviewModal(true);
  };

  const exportTemplates = () => {
    const exportData = templates.map(template => ({
      name: template.template_name,
      type: template.template_type,
      category: template.template_category,
      subject: template.subject,
      content: template.content,
      description: template.description
    }));

    const csvContent = [
      ['Name', 'Type', 'Category', 'Subject', 'Content', 'Description'].join(','),
      ...exportData.map(template => 
        [
          template.name,
          template.type,
          template.category,
          template.subject,
          template.content.replace(/\n/g, '\\n'),
          template.description
        ].map(field => `"${field || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification_templates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type) => {
    const typeObj = templateTypes.find(t => t.value === type);
    return typeObj ? typeObj.icon : FaEnvelope;
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'email': return 'bg-primary';
      case 'sms': return 'bg-success';
      case 'whatsapp': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || template.template_type === filterType;
    const matchesCategory = !filterCategory || template.template_category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="glass-bg min-vh-100 d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading notification templates...</p>
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
              Notification Templates
            </h2>
            <p className="text-muted mb-0">Manage email, SMS, and WhatsApp templates</p>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-secondary glass-btn"
              onClick={exportTemplates}
            >
              <FaFileExport className="me-2" />
              Export
            </button>
            <button 
              className="btn btn-primary glass-btn-primary"
              onClick={() => { resetForm(); setShowModal(true); }}
            >
              <FaPlus className="me-2" />
              Create Template
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text glass-input">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {templateTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select glass-input"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {templateCategories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-outline-secondary glass-btn w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('');
                    setFilterCategory('');
                  }}
                >
                  <FaTimes className="me-2" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="card glass-card">
          <div className="card-body">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-5">
                <FaEnvelope className="text-muted mb-3" size={48} />
                <h5 className="text-muted">No templates found</h5>
                <p className="text-muted mb-3">Create your first notification template to get started.</p>
                <div className="d-flex justify-content-center gap-2">
                  <button 
                    className="btn btn-primary glass-btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                  >
                    Create Template
                  </button>
                  <div className="dropdown">
                    <button 
                      className="btn btn-outline-primary glass-btn dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      Use Predefined
                    </button>
                    <ul className="dropdown-menu">
                      {predefinedTemplates.map((template, index) => (
                        <li key={index}>
                          <button 
                            className="dropdown-item"
                            onClick={() => {
                              loadPredefinedTemplate(template);
                              setShowModal(true);
                            }}
                          >
                            {template.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="row g-4">
                {filteredTemplates.map((template) => {
                  const TypeIcon = getTypeIcon(template.template_type);
                  return (
                    <div key={template.template_id} className="col-lg-6 col-xl-4">
                      <div className="card h-100 glass-effect border">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <TypeIcon className="me-2 text-primary" />
                            <h6 className="mb-0 fw-semibold">{template.template_name}</h6>
                          </div>
                          <span className={`badge glass-badge ${getTypeBadgeClass(template.template_type)}`}>
                            {template.template_type.toUpperCase()}
                          </span>
                        </div>
                        <div className="card-body">
                          <div className="mb-2">
                            <small className="text-muted">Category: </small>
                            <span className="badge bg-secondary glass-badge">
                              {templateCategories.find(c => c.value === template.template_category)?.label || template.template_category}
                            </span>
                          </div>
                          
                          {template.subject && (
                            <div className="mb-2">
                              <small className="text-muted">Subject:</small>
                              <div className="fw-semibold">
                                {template.subject.length > 50 
                                  ? `${template.subject.substring(0, 50)}...`
                                  : template.subject
                                }
                              </div>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <small className="text-muted">Content Preview:</small>
                            <div className="text-muted small" style={{ maxHeight: '60px', overflow: 'hidden' }}>
                              {template.content.length > 120 
                                ? `${template.content.substring(0, 120)}...`
                                : template.content
                              }
                            </div>
                          </div>

                          {template.description && (
                            <div className="mb-3">
                              <small className="text-muted">{template.description}</small>
                            </div>
                          )}

                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <span className={`badge ${template.is_active ? 'bg-success' : 'bg-secondary'} glass-badge`}>
                                {template.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-info glass-btn"
                                onClick={() => previewTemplate(template)}
                                title="Preview"
                              >
                                <FaEye />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary glass-btn"
                                onClick={() => duplicateTemplate(template)}
                                title="Duplicate"
                              >
                                <FaCopy />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary glass-btn"
                                onClick={() => openEditTemplate(template)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger glass-btn"
                                onClick={() => handleDelete(template.template_id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaEnvelope className="me-2" />
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
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
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Template Name *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={templateForm.template_name}
                          onChange={(e) => setTemplateForm({...templateForm, template_name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Type *</label>
                        <select
                          className="form-select glass-input"
                          value={templateForm.template_type}
                          onChange={(e) => setTemplateForm({...templateForm, template_type: e.target.value})}
                          required
                        >
                          {templateTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Category *</label>
                        <select
                          className="form-select glass-input"
                          value={templateForm.template_category}
                          onChange={(e) => setTemplateForm({...templateForm, template_category: e.target.value})}
                          required
                        >
                          {templateCategories.map(category => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Email specific fields */}
                      {templateForm.template_type === 'email' && (
                        <>
                          <div className="col-12">
                            <label className="form-label fw-semibold">Subject *</label>
                            <input
                              type="text"
                              className="form-control glass-input"
                              value={templateForm.subject}
                              onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                              required={templateForm.template_type === 'email'}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold">Sender Name</label>
                            <input
                              type="text"
                              className="form-control glass-input"
                              value={templateForm.sender_name}
                              onChange={(e) => setTemplateForm({...templateForm, sender_name: e.target.value})}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold">Sender Email</label>
                            <input
                              type="email"
                              className="form-control glass-input"
                              value={templateForm.sender_email}
                              onChange={(e) => setTemplateForm({...templateForm, sender_email: e.target.value})}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-semibold">Reply To</label>
                            <input
                              type="email"
                              className="form-control glass-input"
                              value={templateForm.reply_to}
                              onChange={(e) => setTemplateForm({...templateForm, reply_to: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      {/* Content */}
                      <div className="col-12">
                        <label className="form-label fw-semibold">Content *</label>
                        <div className="row">
                          <div className="col-md-8">
                            <textarea
                              className="form-control glass-input"
                              rows="10"
                              value={templateForm.content}
                              onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                              required
                              style={{ fontFamily: 'monospace' }}
                            />
                          </div>
                          <div className="col-md-4">
                            <div className="card glass-effect h-100">
                              <div className="card-header">
                                <h6 className="card-title mb-0">Variables</h6>
                              </div>
                              <div className="card-body" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                <small className="text-muted mb-2 d-block">Click to insert:</small>
                                {commonVariables.map((variable, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary glass-btn me-1 mb-1"
                                    onClick={() => insertVariable(variable)}
                                    style={{ fontSize: '11px' }}
                                  >
                                    {variable}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Fields */}
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Description</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          value={templateForm.description}
                          onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold">Tags</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="Comma-separated tags"
                          value={templateForm.tags}
                          onChange={(e) => setTemplateForm({...templateForm, tags: e.target.value})}
                        />
                      </div>
                      <div className="col-md-2">
                        <div className="form-check form-switch mt-4">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={templateForm.is_active}
                            onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                          />
                          <label className="form-check-label">
                            Active
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
                      type="button"
                      className="btn btn-outline-info glass-btn"
                      onClick={() => previewTemplate(templateForm)}
                    >
                      <FaEye className="me-2" />
                      Preview
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary glass-btn-primary"
                    >
                      <FaSave className="me-2" />
                      {editingTemplate ? 'Update' : 'Create'} Template
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && previewTemplate && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-backdrop fade show"></div>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content glass-modal">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <FaEye className="me-2" />
                    Template Preview
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPreviewModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{previewTemplate.template_name}</strong>
                        <span className={`badge ms-2 ${getTypeBadgeClass(previewTemplate.template_type)}`}>
                          {previewTemplate.template_type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      {previewTemplate.template_type === 'email' && previewTemplate.subject && (
                        <div className="mb-3">
                          <strong>Subject:</strong> {previewTemplate.subject}
                        </div>
                      )}
                      <div className="border rounded p-3" style={{ 
                        backgroundColor: '#f8f9fa',
                        whiteSpace: 'pre-wrap',
                        fontFamily: previewTemplate.template_type === 'email' ? 'inherit' : 'monospace'
                      }}>
                        {previewTemplate.content}
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

export default NotificationTemplates;