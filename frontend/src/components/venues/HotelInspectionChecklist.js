import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { venueAPI } from '../../services/api';

const HotelInspectionChecklist = () => {
  const { id } = useParams();
  const [checklist, setChecklist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        setIsLoading(true);
        // This is a placeholder for the actual API call
        // You will need to implement the backend for this
        const response = await venueAPI.getChecklist(id);
        setChecklist(response.data);
      } catch (error) {
        console.error('Error fetching checklist:', error);
        toast.error('Failed to fetch checklist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklist();
  }, [id]);

  const handleCheck = (itemId) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleSave = async () => {
    try {
      // This is a placeholder for the actual API call
      // You will need to implement the backend for this
      await venueAPI.updateChecklist(id, checklist);
      toast.success('Checklist saved successfully');
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save checklist');
    }
  };

  if (isLoading) {
    return <p>Loading checklist...</p>;
  }

  return (
    <div className="card glass-card">
      <div className="card-body">
        <h5 className="card-title">Hotel Inspection Checklist</h5>
        <ul className="list-group">
          {checklist.map(item => (
            <li key={item.id} className="list-group-item">
              <input 
                type="checkbox" 
                className="form-check-input me-2"
                checked={item.checked}
                onChange={() => handleCheck(item.id)}
              />
              {item.text}
            </li>
          ))}
        </ul>
        <button className="btn btn-primary mt-3" onClick={handleSave}>Save Checklist</button>
      </div>
    </div>
  );
};

export default HotelInspectionChecklist;
