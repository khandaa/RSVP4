# Product Requirements Document: RSVP Event Application

## 1. Introduction/Overview

The RSVP Event Application is a comprehensive event management system specifically designed for wedding planning and guest management. This full-stack web application enables users to efficiently manage wedding RSVPs, guests, groups, events, logistics, and communications. It provides a centralized platform for tracking guest responses, managing event details, and coordinating logistics, addressing the complex challenges of wedding planning and guest coordination.

## 2. Goals

- Provide a centralized system to manage all aspects of wedding guest management and RSVP tracking
- Simplify guest list organization with robust search, filtering, and grouping capabilities
- Streamline communication with guests through multiple channels (Email, SMS, WhatsApp)
- Offer reporting and analytics to track RSVP responses and plan accordingly
- Provide secure, personalized RSVP links for each guest
- Enable logistics management for guest travel, accommodations, and transportation
- Create a user-friendly interface for both administrators and guests

## 3. User Stories

- **As an event organizer**, I want to create and manage my guest list so that I can keep track of who I've invited.
- **As an event organizer**, I want to group guests by family/relationship so that I can organize seating arrangements and send group communications.
- **As an event organizer**, I want to send secure RSVP links to guests so they can easily respond to my invitation.
- **As an event organizer**, I want to track RSVP responses in real-time so I can plan catering and venue requirements accurately.
- **As an event organizer**, I want to manage multiple wedding-related events in a schedule so guests know when and where to attend.
- **As an event organizer**, I want to coordinate guest travel and accommodation details so I can arrange pickups or recommend options.
- **As an event organizer**, I want to send notifications to guests so I can update them about event details or changes.
- **As an event organizer**, I want to use WhatsApp integration for communications so I can reach guests through their preferred messaging platform.
- **As an event guest**, I want to easily respond to my RSVP invitation so the hosts know if I'm attending.
- **As an event guest**, I want to provide travel and accommodation details so hosts can assist with arrangements if needed.

## 4. Functional Requirements

1. **Guest Management**
   1.1. The system must allow users to add, edit, and delete guests
   1.2. The system must support bulk import of guests from CSV/Excel
   1.3. The system must capture guest details including name, email, phone, and group association
   1.4. The system must provide search and filtering capabilities for the guest list

2. **Group Management**
   2.1. The system must allow users to create and manage guest groups
   2.2. The system must enable assigning guests to specific groups
   2.3. The system must allow bulk actions on groups (notifications, assignments)

3. **RSVP Management**
   3.1. The system must generate unique, secure tokens for each guest's RSVP
   3.2. The system must provide a dashboard showing RSVP status summaries
   3.3. The system must track individual RSVP responses (attending, not attending, pending)
   3.4. The system must allow guests to update their RSVP status through secure links

4. **Event Management**
   4.1. The system must support creating multiple events within a wedding
   4.2. The system must track event details including name, description, start/end times
   4.3. The system must allow assigning guests to specific events
   4.4. The system must provide a calendar/timeline view of all events

5. **Logistics Management**
   5.1. The system must track guest travel information (mode, arrival times)
   5.2. The system must manage stay arrangements for out-of-town guests
   5.3. The system must coordinate pick-up and drop services for guests
   5.4. The system must provide reports on logistics requirements

6. **Notifications**
   6.1. The system must support email notifications to guests
   6.2. The system must support SMS notifications to guests
   6.3. The system must enable WhatsApp integration for messaging
   6.4. The system must provide templates for common notification scenarios
   6.5. The system must track message delivery status

7. **Dashboard and Reporting**
   7.1. The system must provide an overview dashboard showing key metrics
   7.2. The system must generate reports on guest status, group distributions, and RSVP rates
   7.3. The system must visualize data through charts and graphs

8. **Admin Functions**
   8.1. The system must provide secure login for administrators
   8.2. The system must support default admin credentials (admin/admin)
   8.3. The system must include user management capabilities

9. **Chatbot/FAQ**
   9.1. The system must provide an automated chatbot to answer common guest questions
   9.2. The system must allow customization of FAQ responses

10. **WhatsApp Integration**
    10.1. The system must connect with WhatsApp API for messaging
    10.2. The system must support template messages for WhatsApp
    10.3. The system must track WhatsApp message status

## 5. Non-Goals (Out of Scope)

1. Payment processing for wedding gifts or contributions
2. Photography/video management or sharing
3. Wedding venue booking or vendor management
4. Wedding website creation (though sharing links to existing websites is supported)
5. Social media integration beyond WhatsApp
6. Guest mobile application (focusing on web-based solution only)
7. Multi-language support for the initial release
8. Gift registry integration

## 6. Design Considerations

- The application uses Material UI and Bootstrap for a clean, modern, responsive design
- The dashboard layout provides easy navigation to all major sections
- The interface should be intuitive for users with minimal technical experience
- Mobile responsiveness is essential for both admin and guest interfaces
- Color scheme should be customizable to match wedding themes

## 7. Technical Considerations

- **Frontend**: React.js with Material UI and Bootstrap components
- **Backend**: Flask (Python) REST API
- **Database**: SQLite for development, PostgreSQL for production
- **Authentication**: Simple username/password for admin access, token-based for guest RSVP links
- **APIs**: WhatsApp Business API integration for messaging
- **Deployment**: Containerized deployment recommended for scalability
- **Testing**: Unit tests for both frontend and backend components

## 8. Success Metrics

- 90%+ RSVP response rate (compared to industry average of ~70-80%)
- Reduction in time spent on guest management by 50%
- Improved guest satisfaction through streamlined RSVP process
- 80%+ of guests providing complete travel and logistics information
- Reduction in manual communications needed by 60%
- High adoption rate of WhatsApp communications (70%+ of guests)

## 9. Open Questions

1. Should the system support multiple weddings/events for the same administrator? - yes
2. What level of customization should be allowed for the RSVP forms? - minimal
3. Should we integrate with email marketing platforms for more advanced communications? - no
4. How can we handle guests without email addresses or smartphones? - phone and email are mandatory
5. What data retention policies should be implemented after the event? - 30 days data retention
6. Should we consider integrations with other wedding planning tools? - no
7. How can we scale the WhatsApp integration for very large guest lists? - restrict it to 1000 guests
8. Should we add support for dietary preferences and meal selection in the RSVP process? - yes


# RSVP Event Application Database

## Overview
This directory contains the SQLite database for the RSVP Event Application. The database structure is defined in `schema.sql` and implemented in the `rsvp_events.db` file.

## Database Schema

### Tables
The database includes the following tables:

#### Users and Authentication
- **users**: User accounts and profiles
- **roles**: System roles (admin, event_manager, etc.)
- **user_roles**: Mapping between users and roles
- **permissions**: System permissions
- **role_permissions**: Mapping between roles and permissions

#### Event Management
- **events**: Event details
- **event_venues**: Venues for events
- **event_schedules**: Event schedules and agendas

#### Guest Management
- **guests**: Guest information
- **guest_groups**: Groups of guests
- **guest_group_members**: Guests assigned to groups

#### RSVP Management
- **rsvp_invitations**: Event invitations
- **rsvp_responses**: Guest responses to invitations
- **rsvp_plus_ones**: Additional guests

#### Logistics Management
- **accommodations**: Accommodation details
- **guest_accommodations**: Guest accommodation assignments
- **transportation**: Transportation options

### Relationships
![Database Relationships](./database_relationships.png)

### Default Data
- Pre-defined roles (admin, event_manager, event_host, guest, hospitality, vendor)
- Default admin user (username: admin, password: admin123) - **Please change after first login**

## Usage
To connect to this database in the application, use the provided database connection helpers in `backend/db/sqlite.js`.

## Maintenance

### Backing Up the Database
```bash
sqlite3 rsvp_events.db .dump > backup_$(date +%Y%m%d).sql
```

### Restoring from a Backup
```bash
sqlite3 rsvp_events.db < backup_file.sql
```

### Viewing Database Structure
```bash
sqlite3 rsvp_events.db .schema
```
