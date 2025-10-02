# Pending Tasks Checklist

This checklist is generated from `prompts_pending.md` and includes a breakdown of subtasks for each pending item.

- [ ] **Fix guest allocation to sub-events**
  - [ ] Review the `GuestAllocation` component and its backend counterpart.
  - [ ] Debug the logic for associating guests with sub-events.
  - [ ] Ensure the `rsvp_guest_event_allocation` table is correctly updated.
  - [ ] when adding guests to an event/sub-event the guest/list page should show guests for that particular event only.



- [ ] **Fix accommodation management**
  - [ ] Debug and resolve the error in the "Add Accommodation" feature.
  - [ ] Ensure the form correctly saves accommodation details.

- [ ] **Enhance venue management**
  - [ ] Allow associating multiple venues with a single event.
  - [ ] Make the `cost` field optional when creating a venue.
  - [ ] Fix the issue where `address`, `city`, and `capacity` are not being stored in the database. Make all of these fields optional

- [ ] **Fix sub-event management**
  - [ ] Debug and resolve the error in the "Edit Subevent" feature.
    - [ ] Fix the edit link

- [ ] **Guest Management Feature Task List**
**Task List for Guest Management Feature**

### Backend (Express.js & SQLite)

1. **refer to guest tables**
understand these tables and then implement the below functionality
rsvp_master_guests
rsvp_guest_documents
rsvp_guest_details
rsvp_guest_event_allocation
rsvp_guest_group_details
rsvp_guest_travel

2. **API Endpoints (`/api/guests`)**

	* **File Upload**
		+ Create a `POST /api/guests/:id/documents` endpoint to handle document uploads for a specific guest
	* **Guest Data Management**
		+ Enhance the `GET /api/guests` endpoint to return the new fields
		+ Enhance the `PUT /api/guests/:id` endpoint to allow updating all the new fields, including travel, accommodation, and preferences
	* **RSVP Management**
		+ Create a `POST /api/guests/:id/rsvp` endpoint to update the main RSVP status
		+ Create a `POST /api/guests/:id/sub-events/:sub_event_id/rsvp` endpoint to manage RSVP for sub-events
	* **Invitations**
		+ Create a `POST /api/guests/send-invites` endpoint that can send invitations in bulk (this might integrate with an email service)

### Frontend (React)

1. **New Component: `GuestActivities.js`**
	* Create a new page/component to serve as the central hub for guest management
	* Use a table library (like Material-UI's `DataGrid` or `react-table`) to display guest information
	* **Table Columns**
		+ Guest Name
		+ RSVP Status (with a dropdown/button to change it)
		+ Events/Sub-events invited to (with RSVP status for each)
		+ Travel Details (perhaps a modal popup to view/edit)
		+ Room Allocation
		+ No. of Accompanying Guests
		+ Preferences
		+ Documents (with a button to upload/view)
		+ Comments (editable field or modal)
		+ Actions (buttons for "Send Invite", "Update Details", "Delete Guest")

2. **Component Functionality**
	* **Data Fetching:** Fetch all guest data on component mount
	* **State Management:** Use React state to manage guest data, table sorting, and filtering
	* **Actions**
		+ Implement functions to handle API calls for updating RSVP, guest details, etc.
		+ Create a modal for uploading documents
		+ Create a modal for viewing/editing travel, accommodation, and other detailed information

3. **Routing and Sidebar**
	* Add a new route for the `GuestActivities` page in `App.js`
	* Add a link to the new page in the appropriate sidebar configuration file (e.g., `AdminSidebar.js`)

- [ ] **Implement document upload for guests**
  - [ ] Add the ability to upload documents for each guest.
  - [ ] Create a new database table to store document metadata.
  - [ ] Develop a UI to display all attachments for a guest.
