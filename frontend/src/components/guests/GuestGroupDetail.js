import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { guestGroupAPI, guestAPI, clientAPI, eventAPI } from '../../services/api';
import { FaUsers, FaArrowLeft } from 'react-icons/fa';

const GuestGroupDetail = () => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [client, setClient] = useState(null);
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setIsLoading(true);
        const groupResponse = await guestGroupAPI.getGuestGroup(id);
        const membersResponse = await guestAPI.getGuests({ group_id: id });

        if (groupResponse.data) {
          setGroup(groupResponse.data);
          if (groupResponse.data.client_id) {
            const clientResponse = await clientAPI.getClient(groupResponse.data.client_id);
            if (clientResponse.data) setClient(clientResponse.data);
          }
          if (groupResponse.data.event_id) {
            const eventResponse = await eventAPI.getEvent(groupResponse.data.event_id);
            if (eventResponse.data) setEvent(eventResponse.data);
          }
        }
        if (membersResponse.data) {
          setMembers(membersResponse.data);
        }
      } catch (error) {
        toast.error('Failed to fetch group details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [id]);

  if (isLoading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  if (!group) {
    return <div className="alert alert-danger">Group not found.</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex align-items-center mb-4">
        <Link to="/guests/groups" className="btn btn-outline-secondary me-3"><FaArrowLeft /></Link>
        <div>
          <h2 className="mb-0"><FaUsers className="me-2" />{group.group_name}</h2>
          <p className="text-muted">{group.group_description}</p>
        </div>
      </div>

      <div className="row mb-4">
        {client && <div className="col-md-4"><strong>Client:</strong> {client.client_name}</div>}
        {event && <div className="col-md-4"><strong>Event:</strong> {event.event_name}</div>}
      </div>

      <div className="card glass-card">
        <div className="card-header">
          <h5>Group Members ({members.length})</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.guest_id}>
                    <td><Link to={`/guests/${member.guest_id}`}>{member.guest_first_name} {member.guest_last_name}</Link></td>
                    <td>{member.guest_email}</td>
                    <td>{member.guest_phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestGroupDetail;
