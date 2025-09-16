import axios from '../utils/axiosConfig';

const masterDataAPI = {
  getEventTypes: async () => {
    try {
      console.log('Fetching event types...');
      const response = await axios.get('/api/master-data/event-types');
      
      console.log('Event types response:', response);
      
      // Handle different response formats
      let eventTypes = [];
      if (Array.isArray(response.data)) {
        // If response.data is already an array, use it directly
        eventTypes = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        // If response.data has a data property that's an array, use that
        eventTypes = response.data.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data.rows)) {
        // If response.data.data has a rows property that's an array, use that
        eventTypes = response.data.data.rows;
      }
      
      console.log('Processed event types:', eventTypes);
      return eventTypes;
    } catch (error) {
      console.error('Error fetching event types:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
  }
};

export default masterDataAPI;
