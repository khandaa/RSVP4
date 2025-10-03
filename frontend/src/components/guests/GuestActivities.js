import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEnvelope,
  FaUpload,
  FaEye,
  FaEdit,
  FaFilter,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaQuestionCircle,
  FaPlane,
  FaBed,
  FaFileAlt
} from 'react-icons/fa';
import { DataGrid } from '@mui/x-data-grid';
import {
  Modal,
  Button,
  Form,
  Dropdown,
  Badge,
  OverlayTrigger,
  Tooltip
} from 'react-bootstrap';

const GuestActivities = () => {
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [rsvpFilter, setRsvpFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Selected items
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState([]);

  // Form data
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [documentIdentifier, setDocumentIdentifier] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('');
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [inviteContent, setInviteContent] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId');

  useEffect(() => {
    if (initialEventId) {
      setEventFilter(initialEventId);
    }
    fetchData();
  }, [initialEventId]);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm, rsvpFilter, eventFilter]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [guestsResponse, eventsResponse] = await Promise.all([
        api.get('/guests'),
        api.get('/events')
      ]);

      setGuests(guestsResponse.data || []);
      setEvents(eventsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterGuests = useCallback(() => {
    let filtered = [...guests];

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(g => g.event_id === parseInt(eventFilter));
    }

    // RSVP filter
    if (rsvpFilter !== 'all') {
      filtered = filtered.filter(g => g.rsvp?.rsvp_status === rsvpFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(g =>
        `${g.guest_first_name} ${g.guest_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.guest_phone?.includes(searchTerm)
      );
    }

    setFilteredGuests(filtered);
  }, [guests, searchTerm, rsvpFilter, eventFilter]);

  // RSVP Status Badge
  const getRsvpBadge = (rsvpStatus) => {
    if (!rsvpStatus) {
      return <Badge bg="secondary"><FaClock /> Pending</Badge>;
    }
    switch (rsvpStatus) {
      case 'Attending':
        return <Badge bg="success"><FaCheckCircle /> Attending</Badge>;
      case 'Not Attending':
        return <Badge bg="danger"><FaTimesCircle /> Not Attending</Badge>;
      case 'Maybe':
        return <Badge bg="warning"><FaQuestionCircle /> Maybe</Badge>;
      default:
        return <Badge bg="secondary"><FaClock /> Pending</Badge>;
    }
  };

  // Handle RSVP Update
  const handleRsvpUpdate = async () => {
    if (!selectedGuest || !rsvpStatus) {
      toast.error('Please select RSVP status');
      return;
    }

    try {
      await api.post(`/guests/${selectedGuest.guest_id}/rsvp`, {
        rsvp_status: rsvpStatus,
        notes: rsvpNotes,
        communication_id: 1 // This should be dynamic based on actual communication
      });

      toast.success('RSVP updated successfully');
      setShowRsvpModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP');
    }
  };

  // Handle Document Upload
  const handleDocumentUpload = async () => {
    if (!selectedGuest || !documentFile) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('document', documentFile);
    formData.append('document_type', documentType);
    formData.append('document_identifier_value', documentIdentifier);

    try {
      await api.post(`/guests/${selectedGuest.guest_id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setDocumentFile(null);
      setDocumentType('');
      setDocumentIdentifier('');
      fetchData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  // Handle Send Invites
  const handleSendInvites = async () => {
    if (selectedGuestIds.length === 0) {
      toast.error('Please select at least one guest');
      return;
    }

    if (!inviteContent || !eventFilter || eventFilter === 'all') {
      toast.error('Please select an event and enter invite content');
      return;
    }

    try {
      const response = await api.post('/guests/send-invites', {
        guest_ids: selectedGuestIds,
        event_id: parseInt(eventFilter),
        communication_type: 'Email',
        communication_content: inviteContent
      });

      toast.success(`Invitations sent: ${response.data.successful} successful, ${response.data.failed} failed`);
      setShowInviteModal(false);
      setInviteContent('');
      setSelectedGuestIds([]);
    } catch (error) {
      console.error('Error sending invites:', error);
      toast.error('Failed to send invites');
    }
  };

  // DataGrid Columns
  const columns = [
    {
      field: 'guest_name',
      headerName: 'Guest Name',
      width: 200,
      valueGetter: (params) => `${params.row.guest_first_name} ${params.row.guest_last_name}`
    },
    {
      field: 'guest_email',
      headerName: 'Email',
      width: 220
    },
    {
      field: 'guest_phone',
      headerName: 'Phone',
      width: 150
    },
    {
      field: 'event_name',
      headerName: 'Event',
      width: 180
    },
    {
      field: 'rsvp_status',
      headerName: 'RSVP Status',
      width: 150,
      renderCell: (params) => getRsvpBadge(params.row.rsvp?.rsvp_status)
    },
    {
      field: 'subevents',
      headerName: 'Sub-events',
      width: 120,
      renderCell: (params) => (
        <Badge bg="info">
          {params.row.subevent_allocations?.length || 0}
        </Badge>
      )
    },
    {
      field: 'travel',
      headerName: 'Travel',
      width: 100,
      renderCell: (params) => (
        params.row.travel?.length > 0 ? (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{params.row.travel.length} travel record(s)</Tooltip>}
          >
            <span><FaPlane className="text-primary" /></span>
          </OverlayTrigger>
        ) : null
      )
    },
    {
      field: 'accommodation',
      headerName: 'Room',
      width: 100,
      renderCell: (params) => (
        params.row.accommodation?.length > 0 ? (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{params.row.accommodation[0]?.room_name || 'Allocated'}</Tooltip>}
          >
            <span><FaBed className="text-success" /></span>
          </OverlayTrigger>
        ) : null
      )
    },
    {
      field: 'documents',
      headerName: 'Docs',
      width: 100,
      renderCell: (params) => (
        <Badge bg="secondary">
          {params.row.documents?.length || 0}
        </Badge>
      )
    },
    {
      field: 'dietary',
      headerName: 'Preferences',
      width: 150,
      renderCell: (params) => (
        params.row.details?.dietary_restrictions ? (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{params.row.details.dietary_restrictions}</Tooltip>}
          >
            <Badge bg="warning">Dietary</Badge>
          </OverlayTrigger>
        ) : null
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => navigate(`/guests/${params.row.guest_id}`)}
          >
            <FaEye />
          </Button>
          <Button
            size="sm"
            variant="outline-warning"
            onClick={() => navigate(`/guests/${params.row.guest_id}/edit`)}
          >
            <FaEdit />
          </Button>
          <Dropdown>
            <Dropdown.Toggle size="sm" variant="outline-secondary">
              •••
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => {
                setSelectedGuest(params.row);
                setRsvpStatus(params.row.rsvp?.rsvp_status || 'Pending');
                setShowRsvpModal(true);
              }}>
                Update RSVP
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedGuest(params.row);
                setShowUploadModal(true);
              }}>
                <FaUpload /> Upload Document
              </Dropdown.Item>
              <Dropdown.Item onClick={() => {
                setSelectedGuest(params.row);
                setShowDetailsModal(true);
              }}>
                <FaEye /> View Details
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )
    }
  ];

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Guest Activities Management</h3>
              <Button
                variant="primary"
                onClick={() => {
                  if (selectedGuestIds.length === 0) {
                    toast.warning('Please select guests to send invites');
                    return;
                  }
                  setShowInviteModal(true);
                }}
                disabled={selectedGuestIds.length === 0}
              >
                <FaEnvelope /> Send Invites ({selectedGuestIds.length})
              </Button>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    <option value="all">All Events</option>
                    {events.map(event => (
                      <option key={event.event_id} value={event.event_id}>
                        {event.event_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={rsvpFilter}
                    onChange={(e) => setRsvpFilter(e.target.value)}
                  >
                    <option value="all">All RSVP Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Attending">Attending</option>
                    <option value="Not Attending">Not Attending</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setEventFilter('all');
                      setRsvpFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Data Grid */}
              <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={filteredGuests}
                  columns={columns}
                  getRowId={(row) => row.guest_id}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  checkboxSelection
                  onSelectionModelChange={(ids) => setSelectedGuestIds(ids)}
                  loading={isLoading}
                  disableSelectionOnClick
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Update Modal */}
      <Modal show={showRsvpModal} onHide={() => setShowRsvpModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update RSVP Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Guest</Form.Label>
            <Form.Control
              type="text"
              value={selectedGuest ? `${selectedGuest.guest_first_name} ${selectedGuest.guest_last_name}` : ''}
              disabled
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>RSVP Status</Form.Label>
            <Form.Select value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value)}>
              <option value="">Select Status</option>
              <option value="Pending">Pending</option>
              <option value="Attending">Attending</option>
              <option value="Not Attending">Not Attending</option>
              <option value="Maybe">Maybe</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rsvpNotes}
              onChange={(e) => setRsvpNotes(e.target.value)}
              placeholder="Additional notes..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRsvpModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleRsvpUpdate}>
            Update RSVP
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Document Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Guest</Form.Label>
            <Form.Control
              type="text"
              value={selectedGuest ? `${selectedGuest.guest_first_name} ${selectedGuest.guest_last_name}` : ''}
              disabled
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Document Type</Form.Label>
            <Form.Select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="">Select Type</option>
              <option value="PAN">PAN</option>
              <option value="AADHAR">AADHAR</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Driving License">Driving License</option>
              <option value="Passport">Passport</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Document ID/Number</Form.Label>
            <Form.Control
              type="text"
              value={documentIdentifier}
              onChange={(e) => setDocumentIdentifier(e.target.value)}
              placeholder="Enter document number"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload File</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocumentFile(e.target.files[0])}
            />
            <Form.Text className="text-muted">
              Accepted formats: PDF, JPG, PNG (Max 10MB)
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDocumentUpload}>
            Upload
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Send Invites Modal */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Send Invitations</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Selected Guests: {selectedGuestIds.length}</Form.Label>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Event</Form.Label>
            <Form.Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
              <option value="all">Select Event</option>
              {events.map(event => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Invitation Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={inviteContent}
              onChange={(e) => setInviteContent(e.target.value)}
              placeholder="Enter invitation message..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendInvites}>
            <FaEnvelope /> Send Invitations
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Guest Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Guest Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGuest && (
            <div>
              <h5>{selectedGuest.guest_first_name} {selectedGuest.guest_last_name}</h5>
              <hr />

              <h6>Contact Information</h6>
              <p>
                <strong>Email:</strong> {selectedGuest.guest_email || 'N/A'}<br />
                <strong>Phone:</strong> {selectedGuest.guest_phone || 'N/A'}<br />
                <strong>Event:</strong> {selectedGuest.event_name}
              </p>

              {selectedGuest.details && Object.keys(selectedGuest.details).length > 0 && (
                <>
                  <h6>Additional Details</h6>
                  <p>
                    <strong>Address:</strong> {selectedGuest.details.guest_address || 'N/A'}<br />
                    <strong>City:</strong> {selectedGuest.details.guest_city || 'N/A'}<br />
                    <strong>Dietary Restrictions:</strong> {selectedGuest.details.dietary_restrictions || 'None'}<br />
                    <strong>Special Requirements:</strong> {selectedGuest.details.special_requirements || 'None'}
                  </p>
                </>
              )}

              {selectedGuest.travel && selectedGuest.travel.length > 0 && (
                <>
                  <h6>Travel Information</h6>
                  {selectedGuest.travel.map((t, idx) => (
                    <p key={idx}>
                      <strong>{t.travel_type}:</strong> {t.travel_from} → {t.travel_to} ({t.travel_mode})<br />
                      <strong>Date/Time:</strong> {t.travel_date} {t.travel_time}
                    </p>
                  ))}
                </>
              )}

              {selectedGuest.accommodation && selectedGuest.accommodation.length > 0 && (
                <>
                  <h6>Accommodation</h6>
                  {selectedGuest.accommodation.map((a, idx) => (
                    <p key={idx}>
                      <strong>Venue:</strong> {a.venue_name || 'N/A'}<br />
                      <strong>Room:</strong> {a.room_name || 'N/A'}<br />
                      <strong>Check-in:</strong> {a.check_in_date} | <strong>Check-out:</strong> {a.check_out_date}
                    </p>
                  ))}
                </>
              )}

              {selectedGuest.subevent_allocations && selectedGuest.subevent_allocations.length > 0 && (
                <>
                  <h6>Sub-event Allocations</h6>
                  <ul>
                    {selectedGuest.subevent_allocations.map((se, idx) => (
                      <li key={idx}>
                        {se.subevent_name} - {getRsvpBadge(se.invitation_status)}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {selectedGuest.documents && selectedGuest.documents.length > 0 && (
                <>
                  <h6>Documents</h6>
                  <ul>
                    {selectedGuest.documents.map((doc, idx) => (
                      <li key={idx}>
                        {doc.document_type} - {doc.document_identifier_value}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GuestActivities;
