import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logisticsAPI } from '../../services/api';

const TravelDetails = () => {
  const { id } = useParams(); // This will be the guest ID
  const [travelDetails, setTravelDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTravelDetails = async () => {
      try {
        setIsLoading(true);
        const response = await logisticsAPI.getTravelArrangementsByGuest(id);
        setTravelDetails(response.data);
      } catch (error) {
        console.error('Error fetching travel details:', error);
        toast.error('Failed to fetch travel details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTravelDetails();
  }, [id]);

  if (isLoading) {
    return <p>Loading travel details...</p>;
  }

  return (
    <div className="card glass-card">
      <div className="card-body">
        <h5 className="card-title">Travel Details</h5>
        {travelDetails.length === 0 ? (
          <p>No travel details found for this guest.</p>
        ) : (
          <ul className="list-group">
            {travelDetails.map(travel => (
              <li key={travel.travel_id} className="list-group-item">
                <strong>{travel.travel_type}:</strong> {travel.travel_from} to {travel.travel_to} on {new Date(travel.travel_date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TravelDetails;
