# Smart Farmer Dashboard - Edge Functions Implementation Plan

## Overview

This plan outlines the creation of 7 Supabase Edge Functions (Deno) to serve as the secure data API layer for the Farmer Management System. All functions will authenticate users via JWT tokens in the Authorization header, return consistent JSON responses with demo data for empty states, support optional limit query parameters (default 5, max 50), and include proper CORS headers for cross-origin requests.

## Edge Functions to Create

1. **`/get-dashboard`** - Returns user profile, counts (farms, crops, inventory, listings), and recent crops/listings arrays (top 5 each). Includes demo object with sample crop and listing.

2. **`/get-farms`** - Returns user's farms (top 5 by created_at). Returns demo farm object if empty.

3. **`/get-crops`** - Returns user's crops with farm_name via JOIN (top 5). Returns demo crop if empty.

4. **`/get-inventory`** - Returns inventory items for user's farms with input names via JOIN (top 5). Returns demo inventory item if empty.

5. **`/get-listings`** - Returns marketplace listings (user's farms if farmer, all active if buyer, top 5). Returns demo listing if empty.

6. **`/get-profile`** - Returns consolidated user profile from user_profile (preferred) or users table fallback. Includes user_id, auth_user_id, first_name, last_name, email, role, phone_number, address, profile_picture.

7. **`/search`** - Optional search endpoint filtering crops and listings by text query (limit 20).

## Technical Specifications

- **Authentication**: All functions verify JWT via `supabase.auth.getUser(token)` from Authorization header
- **Database Access**: Use service_role key server-side (never exposed to client)
- **Query Pattern**: Default LIMIT 5, optional ?limit=N (max 50), ORDER BY created_at/listed_on/added_on DESC
- **Response Format**: `{ success: boolean, data: [...], demo?: {...}, message?: string, error?: string }`
- **CORS Headers**: Access-Control-Allow-Origin: *, Access-Control-Allow-Methods: GET, POST, OPTIONS, Access-Control-Allow-Headers: Content-Type, Authorization
- **Empty State**: When data array is empty, return demo object in response for frontend to display

## Frontend Integration

- **Session Storage**: Login flow already stores `sessionToken` (JWT) and `currentUser` (JSON profile) in sessionStorage
- **API Calls**: Frontend will use GET requests with `Authorization: Bearer <sessionToken>` header
- **Demo Mode**: localStorage key `demoMode` ('on'|'off') controls whether to show demo items
- **Empty State UI**: Show CTA card linking to add pages (farms.html, crops.html, inventory.html, marketplace.html) plus demo preview card

## File Structure

Edge Functions will be created in: `supabase/functions/<function-name>/index.ts`

## Deployment

Functions will be deployable via Supabase CLI: `supabase functions deploy <function-name>`

---

**Ready to proceed?** Please confirm (yes/no) to generate the Edge Functions code, response shapes, frontend integration plan, testing checklist, and deployment instructions.

