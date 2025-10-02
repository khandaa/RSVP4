import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const GuestAllocation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [subevents, setSubevents] = useState([]);
  const [selectedSubevents, setSelectedSubevents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const guestRes = await api.get(`/guests/${id}`);
        setGuest(guestRes.data);

        if (guestRes.data.event_id) {
          const subeventsRes = await api.get(`/comprehensive-crud/subevents?event_id=${guestRes.data.event_id}`);
          setSubevents(subeventsRes.data || []);
        }

        const existingAllocationsRes = await api.get(`/comprehensive-crud/guest-event-allocation?guest_id=${id}`);
        setSelectedSubevents((existingAllocationsRes.data || []).map(alloc => alloc.subevent_id));

      } catch (error) {
        toast.error('Failed to fetch data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCheckboxChange = (subeventId) => {
    setSelectedSubevents(prev => 
      prev.includes(subeventId) 
        ? prev.filter(id => id !== subeventId)
        : [...prev, subeventId]
    );
  };

  const handleSubmit = async () => {
    try {
      // First, delete all existing allocations for this guest
      const existingAllocations = await api.get(`/comprehensive-crud/guest-event-allocation?guest_id=${id}`);
      for (const alloc of existingAllocations.data) {
        await api.delete(`/comprehensive-crud/guest-event-allocation/${alloc.allocation_id}`);
      }

      // Then, create new allocations
      for (const subeventId of selectedSubevents) {
        await api.post('/comprehensive-crud/guest-event-allocation', {
          guest_id: id,
          subevent_id: subeventId,
          event_id: guest.event_id
        });
      }

      toast.success('Allocations updated successfully!');
      navigate(`/guests/${id}`);
    } catch (error) {
      toast.error('Failed to update allocations.');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Allocate {guest?.guest_first_name} to Sub-Events</h2>
      {subevents.map(subevent => (
        <div key={subevent.subevent_id}>
          <input 
            type="checkbox" 
            checked={selectedSubevents.includes(subevent.subevent_id)}
            onChange={() => handleCheckboxChange(subevent.subevent_id)}
          />
          {subevent.subevent_name}
        </div>
      ))}
      <button onClick={handleSubmit}>Save Allocations</button>
      <button onClick={() => navigate(`/guests/${id}`)}>Cancel</button>
    </div>
  );
};

export default GuestAllocation;
