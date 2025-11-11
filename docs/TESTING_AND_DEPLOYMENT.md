# Testing Checklist and Deployment Instructions

## Testing Checklist

### 1. Postman Testing

#### Setup
1. Install Postman
2. Create a new collection: "Farmer Management API"
3. Get a valid JWT token from login flow (store in environment variable `ACCESS_TOKEN`)

#### Test Each Endpoint

##### `/get-dashboard`
- [ ] **With valid token**: Should return profile, counts, recent crops/listings
- [ ] **Without token**: Should return 401 Unauthorized
- [ ] **With invalid token**: Should return 401 Unauthorized
- [ ] **With limit parameter**: `?limit=10` should return up to 10 items
- [ ] **Verify demo object**: Check that `demo.crop` and `demo.listing` are present

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "counts": { ... },
    "recent_crops": [ ... ],
    "recent_listings": [ ... ]
  },
  "demo": {
    "crop": { ... },
    "listing": { ... }
  }
}
```

##### `/get-farms`
- [ ] **With valid token**: Should return user's farms (top 5)
- [ ] **Without token**: Should return 401
- [ ] **With limit**: `?limit=3` should return 3 farms
- [ ] **Empty farms**: Should return `{ success: true, data: [], demo: { farm: {...} }, message: "No farms..." }`

##### `/get-crops`
- [ ] **With valid token**: Should return crops with farm_name
- [ ] **Without token**: Should return 401
- [ ] **Empty crops**: Should return demo crop
- [ ] **Verify farm_name**: Check that each crop includes farm_name from JOIN

##### `/get-inventory`
- [ ] **With valid token**: Should return inventory with input_name
- [ ] **Without token**: Should return 401
- [ ] **Empty inventory**: Should return demo inventory
- [ ] **Verify input_name**: Check that each item includes input_name from JOIN

##### `/get-listings`
- [ ] **Farmer role**: Should return only their farm's listings
- [ ] **Buyer role**: Should return all active listings with seller_name
- [ ] **Without token**: Should return 401
- [ ] **Empty listings**: Should return demo listing
- [ ] **Verify seller_name**: Buyer should see seller_name, farmer should not

##### `/get-profile`
- [ ] **With valid token**: Should return user profile
- [ ] **Without token**: Should return 401
- [ ] **Verify user_profile priority**: If user_profile exists, use it; else use users table
- [ ] **Check all fields**: user_id, auth_user_id, first_name, last_name, email, role, phone_number, address, profile_picture

##### `/search`
- [ ] **With valid token and query**: Should return crops and listings matching query
- [ ] **Without token**: Should return 401
- [ ] **Without query**: Should return message "Please provide a search query"
- [ ] **With limit**: `?limit=10` should return up to 10 results per type
- [ ] **Verify search works**: Search for "maize" should return matching crops and listings

#### Postman Collection Example

```json
{
  "info": {
    "name": "Farmer Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1",
      "type": "string"
    },
    {
      "key": "access_token",
      "value": "YOUR_JWT_TOKEN_HERE",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "get-dashboard",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/get-dashboard?limit=5",
          "host": ["{{base_url}}"],
          "path": ["get-dashboard"],
          "query": [
            {
              "key": "limit",
              "value": "5"
            }
          ]
        }
      }
    }
  ]
}
```

---

### 2. Browser Testing

#### Login Flow
- [ ] Login with valid credentials
- [ ] Verify `sessionToken` is stored in sessionStorage
- [ ] Verify `currentUser` is stored in sessionStorage
- [ ] Redirect to dashboard after login

#### Dashboard Page (`index.html`)
- [ ] Profile displays correctly (name, email, role)
- [ ] Counts display correctly (farms_count, crops_count, etc.)
- [ ] Recent crops list displays (or shows empty state)
- [ ] Recent listings list displays (or shows empty state)
- [ ] Demo mode toggle works
- [ ] When demo mode ON and data empty, demo items show
- [ ] When demo mode OFF and data empty, CTA card shows

#### Farms Page (`fields.html`)
- [ ] Farms list displays (or shows empty state)
- [ ] Demo mode toggle works
- [ ] CTA card links to add farm form
- [ ] Demo preview card shows when empty
- [ ] Limit parameter works (test with ?limit=3)

#### Crops Page (`crops.html`)
- [ ] Crops list displays with farm_name
- [ ] Demo mode toggle works
- [ ] Empty state shows CTA to add crops
- [ ] Demo crop shows when demo mode ON

#### Inventory Page (`inventory.html`)
- [ ] Inventory list displays with input_name
- [ ] Demo mode toggle works
- [ ] Empty state shows CTA to add inventory
- [ ] Demo inventory shows when demo mode ON

#### Marketplace Page (`marketplace.html`)
- [ ] Listings list displays
- [ ] Buyer role sees seller_name
- [ ] Farmer role sees only their listings
- [ ] Demo mode toggle works
- [ ] Empty state shows CTA to create listing

#### Error Handling
- [ ] 401 error redirects to login
- [ ] Network error shows error message
- [ ] 500 error shows server error message
- [ ] Invalid token clears sessionStorage

#### Edge Cases
- [ ] User with farms but no crops
- [ ] User with crops but no marketplace listings
- [ ] User with no farms (should show empty state)
- [ ] Buyer role browsing all listings
- [ ] Limit exceeds 50 (should cap at 50)
- [ ] Limit is 0 or negative (should use default 5)

---

### 3. Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] Farms page loads in < 1 second
- [ ] Crops page loads in < 1 second
- [ ] Inventory page loads in < 1 second
- [ ] Marketplace page loads in < 1 second
- [ ] Search returns results in < 1 second

---

## Deployment Instructions

### Prerequisites

1. **Supabase CLI** installed
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** set up
   - Project URL: `https://bmdypirsqwhghrvbhqoy.supabase.co`
   - Service role key (from Supabase dashboard)
   - Anon key (from Supabase dashboard)

3. **Login to Supabase CLI**
   ```bash
   supabase login
   ```

4. **Link to your project**
   ```bash
   supabase link --project-ref bmdypirsqwhghrvbhqoy
   ```

### Environment Variables

Create a `.env` file in the project root (or set in Supabase dashboard):

```env
SUPABASE_URL=https://bmdypirsqwhghrvbhqoy.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: Never commit `.env` file to git. Add it to `.gitignore`.

### Deploy Each Function

#### 1. Deploy `/get-dashboard`

```bash
supabase functions deploy get-dashboard
```

#### 2. Deploy `/get-farms`

```bash
supabase functions deploy get-farms
```

#### 3. Deploy `/get-crops`

```bash
supabase functions deploy get-crops
```

#### 4. Deploy `/get-inventory`

```bash
supabase functions deploy get-inventory
```

#### 5. Deploy `/get-listings`

```bash
supabase functions deploy get-listings
```

#### 6. Deploy `/get-profile`

```bash
supabase functions deploy get-profile
```

#### 7. Deploy `/search`

```bash
supabase functions deploy search
```

### Deploy All Functions at Once

```bash
supabase functions deploy
```

### Verify Deployment

After deployment, test each function:

```bash
# Test get-dashboard
curl -X GET "https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: application/json"
```

### Update Environment Variables in Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to Project Settings → Edge Functions
3. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Function URLs

After deployment, functions will be available at:

- `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-dashboard`
- `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-farms`
- `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-crops`
- `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-inventory`
- `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-listings`
- `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/get-profile`
- `https://bmdypirsqwhghrvbhqoy.supabase.co/functions/v1/search`

---

## Local Development

### Run Functions Locally

1. **Start Supabase locally** (optional, for local testing)
   ```bash
   supabase start
   ```

2. **Serve functions locally**
   ```bash
   supabase functions serve
   ```

3. **Test locally**
   ```bash
   curl -X GET "http://localhost:54321/functions/v1/get-dashboard" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Accept: application/json"
   ```

### Debugging

1. **View function logs**
   ```bash
   supabase functions logs get-dashboard
   ```

2. **View all function logs**
   ```bash
   supabase functions logs
   ```

3. **Test with verbose output**
   ```bash
   supabase functions deploy get-dashboard --debug
   ```

---

## Security Checklist

- [ ] Service role key is never exposed to client
- [ ] All functions verify JWT token
- [ ] CORS headers are properly set
- [ ] Limit parameter is validated (max 50)
- [ ] User can only access their own data (except buyers viewing all listings)
- [ ] SQL injection prevention (using parameterized queries via Supabase client)
- [ ] Error messages don't leak sensitive information

---

## Troubleshooting

### Function Deployment Fails

1. **Check Supabase CLI version**
   ```bash
   supabase --version
   ```

2. **Check authentication**
   ```bash
   supabase projects list
   ```

3. **Check function syntax**
   ```bash
   deno check supabase/functions/get-dashboard/index.ts
   ```

### Function Returns 500 Error

1. **Check function logs**
   ```bash
   supabase functions logs get-dashboard
   ```

2. **Verify environment variables**
   - Check Supabase dashboard for set variables
   - Verify service role key is correct

3. **Check database schema**
   - Verify table names match
   - Verify column names match
   - Verify foreign key relationships

### Function Returns 401 Unauthorized

1. **Verify JWT token is valid**
   - Check token expiration
   - Verify token format

2. **Check Authorization header**
   - Must be `Bearer <token>`
   - No extra spaces

3. **Verify user exists in database**
   - Check `users` table for `auth_user_id`

### CORS Errors

1. **Verify CORS headers in function**
   - Check `cors.ts` file
   - Verify headers are set correctly

2. **Check OPTIONS preflight**
   - Verify OPTIONS request returns 200
   - Verify CORS headers in response

---

## Maintenance

### Update Functions

1. Make changes to function code
2. Test locally (if possible)
3. Deploy updated function
4. Verify deployment
5. Test in production

### Monitor Function Usage

1. Check Supabase dashboard for function invocations
2. Monitor function logs for errors
3. Check function execution times
4. Monitor database query performance

### Backup

1. Backup function code (already in git)
2. Backup database schema
3. Backup environment variables (securely)

---

## Next Steps

1. Deploy all functions to Supabase
2. Test each function with Postman
3. Integrate frontend with Edge Functions
4. Test frontend integration in browser
5. Deploy frontend to production
6. Monitor function performance and errors

---

## Support

For issues or questions:
1. Check Supabase documentation
2. Check function logs
3. Verify database schema
4. Test with Postman first
5. Check browser console for frontend errors

