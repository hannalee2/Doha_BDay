# Security Specification for Doha's Birthday RSVP

## Data Invariants
- Every RSVP must have a guest name (string, max 100 chars).
- Number of adults and children must be non-negative integers.
- `createdAt` must be the current server time.
- RSVPs are public to submit but private to read (except for the admin).

## The Dirty Dozen Payloads
1. **The Ghost Field:** `{ name: "Guest", adults: 2, children: 1, createdAt: ..., extra: "malicious" }` -> Denied (Shadow update/create)
2. **The Time Traveler:** `{ name: "Guest", adults: 2, children: 1, createdAt: "2000-01-01" }` -> Denied (Timestamp spoofing)
3. **The Giant Name:** `{ name: "A".repeat(1001), ... }` -> Denied (Resource poisoning)
4. **The Negative Guest:** `{ adults: -1, ... }` -> Denied (Value poisoning)
5. **The Billionaire Attendance:** `{ adults: 9999, ... }` -> Denied (Boundary limit)
6. **The ID Scraper:** Attempting `list` on `/rsvps` as an unauthenticated user -> Denied (Blanket read)
7. **The Update Hijacker:** Attempting to `update` an existing RSVP -> Denied (Immutability)
8. **The Delete Saboteur:** Attempting to `delete` an existing RSVP -> Denied (Deletion guard)
9. **The Admin Impersonator:** Authenticating as `other@gmail.com` and trying to `list` -> Denied (Identity spoofing)
10. **The ID Poisoner:** Creating a document with ID `../../secrets` -> Denied (ID Poisoning/Regex)
11. **The State Skipper:** (N/A for this simple app, but trying to bypass `isValidRSVP`) -> Denied
12. **The PII Blanket:** Unauthorized user trying to `get` a single RSVP document -> Denied

## Test Runner Logic
Verified via manual audit and soon-to-be-deployed rules.
