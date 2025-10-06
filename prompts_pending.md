when adding a new client, the city, phone and email are not visible on the list page - done
Allow to add a new venue as a part of creating event / sub event. It should also be added in the venue list 
when creating a sub-event, the start date should be set to start date of the event 
create subevent button should be close to the form
create subevent on success should ask if you want to create more subevents 
Allow venue location when creating a subevent. It should not be a room 
Button that says add subevent on the event page should list only the subevents of the particular event
error in creating guest group
email should not be mandatory for adding guest
on successful guest addition, it should show guest for that event only 
Add country code in phone number for guest addition
phone number should be restricted to countrycode + 10 digits 
in table mode when adding guests, it is giving error
create group error 
0] Error creating rsvp_master_guest_groups record: [Error: SQLITE_CONSTRAINT: NOT NULL constraint failed: rsvp_master_guest_groups.client_id] {
[0]   errno: 19,
[0]   code: 'SQLITE_CONSTRAINT'
[0] }
[0] Query was: INSERT INTO rsvp_master_guest_groups (group_name, group_description) VALUES (?, ?)
[0] Values were: [ 'BrideFamily', 'family of bride' ]
[0] POST /api/comprehensive-crud/guest-groups 500 26.746 ms - 186

can we connect a personal whatsapp by scanning QR code and send messages 
schedule the messages sent for a time 
error in guest import - fix it 
guest allocation to sub event not working 
capture travel details for guests 
Add hotel inspection checklist to the application
Add travel form is not loading guest and event information
Ability to add travel information alongwith the guest information
typeahead for departure and arrival location
remove departure location 
Keep arrival location - to be self added in the form
Arrival location - railway station / terminal etc 
require pickup / traveling by own 
Fix Add accommodation error 
multiple venue for single event 
Add room category in venue 
Add restaurants in venue 
cost should not be mandatory in venue 
venue - address, city , capacity are not getting stored in database 
Edit subevent not working 
Fetch subevent details not working 
Add filter for event in sub-event page 
want a master sheet for view and edit - call it master guest list 
name, phone , email, travel details, hotel stay , room stay , rsvp, functions invited to , remarks column for each guest 
a flag for need followup on master guest list 
add guest ids for each guest - 3 ids per guest 
upload document ability 
show all attachments for the guest 


Add ability to upload documents for guests 
Create a single page for managing all guest activities. It should be in tabular format and should have fields to add guests, have their RSVP statuses, invite them to various events and sub-events, manage their travel details, room allocation , no of guests coming with them, their preferences if any, This table should also have comments field where the customer should be able to add comments. The table should have fields that are linked to various actions like send invites, update guest details, update rsvp etc


- [ ] **Implement WhatsApp integration**
  - [ ] Research and select a library for WhatsApp integration (e.g., `whatsapp-web.js`).
  - [ ] Create a backend service to manage the WhatsApp client and QR code generation.
  - [ ] Develop a frontend component to display the QR code for linking a personal WhatsApp account.
  - [ ] Implement functionality to send and schedule messages.


- [ ] **Add hotel inspection checklist**
  - [ ] Design a database schema for storing checklist templates and inspection results.
  - [ ] Create a new section in the application for managing hotel inspection checklists.
  - [ ] Develop a UI for creating, filling out, and viewing checklists.

- [ ] **Implement travel details capture**
  - [ ] Create a new form for capturing guest travel details.
  - [ ] Ensure the form loads guest and event information correctly.
  - [ ] Add fields for arrival location, pickup requirements, and travel mode.
  - [ ] Implement a typeahead for arrival locations.




Guest add error - email - done 
mobile number field is not restricted to 10 digits - done 
Guest activities RSVP status is not reflecting correctly 
RSVP status is incorrect and guest edit functionality is not there from within the event/subevent 
edit from event page is now available 
Add "Additional guest" field in add guest and edit guest pages




guest activities page columns should be editable so that the details can be managed from this same page 
travel - instead of route, it should be sector 

