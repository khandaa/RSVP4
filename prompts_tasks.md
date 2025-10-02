# Pending Tasks Checklist

This checklist is generated from `prompts_pending.md` and includes a breakdown of subtasks for each pending item.

  - [x] Update the backend to save the `venue_id` with the sub-event.
  - [x] Verify that the frontend sends the `client_id` in the request payload.

- [ ] **Improve guest management**
  - [ ] Make the `email` field optional for adding a guest.
  - [ ] On successful guest addition, redirect to the guest list for the current event.
  - [ ] Add a country code dropdown to the phone number field.
  - [ ] Implement input validation to restrict phone numbers to country code + 10 digits.
  - [ ] Fix errors in the table mode for adding guests. It fails to add the guests 
  - [ ] Fix errors in bulk import of guests. It is unable to add guests due to the errors. 


- [ ] **Fix guest import functionality**
  - [ ] Debug and resolve the error in the guest import process.
  - [ ] Ensure the CSV parser correctly handles all columns.
  - [ ] Improve error reporting for failed rows during import.

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
  - [ ] Add support for room categories and restaurants within a venue.
  - [ ] Make the `cost` field optional when creating a venue.
  - [ ] Fix the issue where `address`, `city`, and `capacity` are not being stored in the database.

- [ ] **Fix sub-event management**
  - [ ] Debug and resolve the error in the "Edit Subevent" feature.
  - [ ] Fix the issue with fetching sub-event details.
  - [ ] Add a filter for events on the sub-event page.

- [ ] **Create a Master Guest List**
  - [ ] Develop a new component for a master guest list with an editable table view.
  - [ ] Include columns for name, phone, email, travel details, hotel stay, RSVP status, and invited functions.
  - [ ] Add a "needs followup" flag for each guest.
  - [ ] Implement functionality to add up to three guest IDs for each guest.

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

