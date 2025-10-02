# Pending Tasks Checklist

This checklist is generated from `prompts_pending.md` and includes a breakdown of subtasks for each pending item.

- [x] **Improve guest management**
  - [x] Make the `email` field optional for adding a guest.
  - [x] On successful guest addition, redirect to the guest list for the current event.
  - [x] Add a country code dropdown to the phone number field.
  - [x] Implement input validation to restrict phone numbers to country code + 10 digits.
  - [x] Fix errors in the table mode for adding guests. It fails to add the guests 
  - [x] Fix errors in bulk import of guests. It is unable to add guests due to the errors. 


- [x] **Fix guest import functionality**
  - [x] Debug and resolve the error in the guest import process.
  - [x] Ensure the CSV parser correctly handles all columns.
  - [x] Improve error reporting for failed rows during import.

- [ ] **Fix guest allocation to sub-events**
  - [ ] Review the `GuestAllocation` component and its backend counterpart.
  - [ ] Debug the logic for associating guests with sub-events.
  - [ ] Ensure the `rsvp_guest_event_allocation` table is correctly updated.

- [ ] **Implement travel details capture**
  - [ ] Create a new form for capturing guest travel details.
  - [ ] Ensure the form loads guest and event information correctly.
  - [ ] Add fields for arrival location, pickup requirements, and travel mode.
  - [ ] Implement a typeahead for arrival locations.
  - [ ] Add a new table `rsvp_guest_travel` to the database if it doesn't exist.


- [ ] **Fix accommodation management**
  - [ ] Debug and resolve the error in the "Add Accommodation" feature.
  - [ ] Ensure the form correctly saves accommodation details.

- [ ] **Enhance venue management**
  - [ ] Allow associating multiple venues with a single event.
  - [ ] Make the `cost` field optional when creating a venue.
  - [ ] Fix the issue where `address`, `city`, and `capacity` are not being stored in the database.

- [ ] **Fix sub-event management**
  - [ ] Debug and resolve the error in the "Edit Subevent" feature.

- [ ] **Guest Management Feature Task List**

**Backend (Express.js & SQLite)**

1.  **Database Schema Updates:**
    *   Modify the `guests` table to include new fields:
        *   `document_path` (for uploaded documents)
        *   `sub_event_rsvps` (JSON or separate table to track RSVP to sub-events)
        *   `travel_details` (JSON or separate table)
        *   `room_allocation` (string or foreign key to a rooms table)
        *   `additional_guests` (integer)
        *   `preferences` (text)
        *   `comments` (text)
    *   Create a new `guest_documents` table to store metadata about uploaded files.
    *   Create a new `sub_events` table if one doesn't exist.

2.  **API Endpoints (`/api/guests`):**
    *   **File Upload:**
        *   Create a `POST /api/guests/:id/documents` endpoint to handle document uploads for a specific guest. This will involve using a library like `multer` for handling file uploads and storing files in a designated directory.
    *   **Guest Data Management:**
        *   Enhance the `GET /api/guests` endpoint to return the new fields.
        *   Enhance the `PUT /api/guests/:id` endpoint to allow updating all the new fields, including travel, accommodation, and preferences.
    *   **RSVP Management:**
        *   Create a `POST /api/guests/:id/rsvp` endpoint to update the main RSVP status.
        *   Create a `POST /api/guests/:id/sub-events/:sub_event_id/rsvp` endpoint to manage RSVP for sub-events.
    *   **Invitations:**
        *   Create a `POST /api/guests/send-invites` endpoint that can send invitations in bulk (this might integrate with an email service).

**Frontend (React)**

1.  **New Component: `GuestActivities.js`**
    *   Create a new page/component to serve as the central hub for guest management.
    *   Use a table library (like Material-UI's `DataGrid` or `react-table`) to display guest information.
    *   **Table Columns:**
        *   Guest Name
        *   RSVP Status (with a dropdown/button to change it)
        *   Events/Sub-events invited to (with RSVP status for each)
        *   Travel Details (perhaps a modal popup to view/edit)
        *   Room Allocation
        *   No. of Accompanying Guests
        *   Preferences
        *   Documents (with a button to upload/view)
        *   Comments (editable field or modal)
        *   Actions (buttons for "Send Invite", "Update Details", "Delete Guest")

2.  **Component Functionality:**
    *   **Data Fetching:** Fetch all guest data on component mount.
    *   **State Management:** Use React state to manage guest data, table sorting, and filtering.
    *   **Actions:**
        *   Implement functions to handle API calls for updating RSVP, guest details, etc.
        *   Create a modal for uploading documents.
        *   Create a modal for viewing/editing travel, accommodation, and other detailed information.

3.  **Routing and Sidebar:**
    *   Add a new route for the `GuestActivities` page in `App.js`.
    *   Add a link to the new page in the appropriate sidebar configuration file (e.g., `AdminSidebar.js`).h guest.

- [ ] **Implement document upload for guests**
  - [ ] Add the ability to upload documents for each guest.
  - [ ] Create a new database table to store document metadata.
  - [ ] Develop a UI to display all attachments for a guest.
- [ ] **Implement WhatsApp integration**
  - [ ] Research and select a library for WhatsApp integration (e.g., `whatsapp-web.js`).
  - [ ] Create a backend service to manage the WhatsApp client and QR code generation.
  - [ ] Develop a frontend component to display the QR code for linking a personal WhatsApp account.
  - [ ] Implement functionality to send and schedule messages.


- [ ] **Add hotel inspection checklist**
  - [ ] Design a database schema for storing checklist templates and inspection results.
  - [ ] Create a new section in the application for managing hotel inspection checklists.
  - [ ] Develop a UI for creating, filling out, and viewing checklists.

