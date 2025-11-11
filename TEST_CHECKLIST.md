# Test Checklist - Login, Profile, and Dashboard Integration

## Prerequisites

1. Ensure Edge Functions are deployed:
   - `/login` - POST endpoint
   - `/create-user` - POST endpoint  
   - `/get-profile` - GET endpoint (requires Authorization header)
   - `/get-dashboard` - GET endpoint (requires Authorization header)

2. Ensure frontend files are loaded in correct order:
   - `api.js` must be loaded before `login.js`, `signup.js`, and `main.js`
   - Check HTML files for correct script order

## Test Scenarios

### 1. Login Flow

#### Test 1.1: Successful Login
- [ ] Navigate to `login.html`
- [ ] Enter valid email and password
- [ ] Click "Sign In" button
- [ ] Verify submit button shows loading state
- [ ] Verify redirect to `index.html` after successful login
- [ ] Verify `sessionToken` is stored in `sessionStorage`
- [ ] Verify `currentUser` is stored in `sessionStorage`
- [ ] Verify `isLoggedIn` flag is set to `'true'` in `sessionStorage`

#### Test 1.2: Invalid Credentials
- [ ] Navigate to `login.html`
- [ ] Enter invalid email or password
- [ ] Click "Sign In" button
- [ ] Verify error message is displayed
- [ ] Verify submit button is re-enabled
- [ ] Verify no redirect occurs
- [ ] Verify no token is stored in `sessionStorage`

#### Test 1.3: Email Not Confirmed
- [ ] Navigate to `login.html`
- [ ] Enter email that is not confirmed
- [ ] Click "Sign In" button
- [ ] Verify message about email not confirmed is displayed
- [ ] Verify "Send magic link" and "Resend confirmation" buttons appear
- [ ] Verify submit button is re-enabled

#### Test 1.4: Network Error
- [ ] Disconnect internet or block network requests
- [ ] Navigate to `login.html`
- [ ] Enter credentials and click "Sign In"
- [ ] Verify network error message is displayed
- [ ] Verify submit button is re-enabled

#### Test 1.5: Form Validation
- [ ] Navigate to `login.html`
- [ ] Try to submit empty form
- [ ] Verify email validation error appears
- [ ] Verify password validation error appears
- [ ] Enter invalid email format
- [ ] Verify email format validation error
- [ ] Enter password less than 6 characters
- [ ] Verify password length validation error

### 2. Signup Flow

#### Test 2.1: Successful Signup with Auto-Login
- [ ] Navigate to `signup.html`
- [ ] Fill in all required fields (first name, last name, email, password, confirm password)
- [ ] Check "Agree to terms" checkbox
- [ ] Click "Sign Up" button
- [ ] Verify submit button shows loading state
- [ ] Verify account creation success message
- [ ] Verify auto-login occurs (if `AUTO_LOGIN_AFTER_SIGNUP = true`)
- [ ] Verify redirect to `index.html`
- [ ] Verify `sessionToken` is stored in `sessionStorage`
- [ ] Verify `currentUser` is stored in `sessionStorage`

#### Test 2.2: Signup without Auto-Login
- [ ] Set `AUTO_LOGIN_AFTER_SIGNUP = false` in `signup.js`
- [ ] Navigate to `signup.html`
- [ ] Fill in all required fields and submit
- [ ] Verify success message about checking email
- [ ] Verify redirect to `login.html`
- [ ] Verify no token is stored (user must login manually)

#### Test 2.3: Signup Validation
- [ ] Navigate to `signup.html`
- [ ] Try to submit empty form
- [ ] Verify all field validation errors appear
- [ ] Enter mismatched passwords
- [ ] Verify password mismatch error
- [ ] Enter password less than 8 characters
- [ ] Verify password length error
- [ ] Try to submit without checking terms
- [ ] Verify terms agreement error

#### Test 2.4: Signup with Existing Email
- [ ] Navigate to `signup.html`
- [ ] Enter email that already exists
- [ ] Submit form
- [ ] Verify appropriate error message is displayed

### 3. Profile Loading

#### Test 3.1: Profile Load on Dashboard
- [ ] Login successfully
- [ ] Navigate to `index.html`
- [ ] Verify profile is loaded automatically
- [ ] Verify greeting displays user's first name: "Good [Morning/Afternoon/Evening], [FirstName]"
- [ ] Verify user name in navbar displays full name
- [ ] Verify avatar displays user initials (first letter of first name + first letter of last name)
- [ ] Verify profile data is stored in `sessionStorage` as `currentUser`

#### Test 3.2: Profile Load with 401 Error
- [ ] Manually set invalid token in `sessionStorage`: `sessionStorage.setItem('sessionToken', 'invalid-token')`
- [ ] Navigate to `index.html`
- [ ] Verify profile request returns 401
- [ ] Verify `sessionToken` is cleared from `sessionStorage`
- [ ] Verify redirect to `login.html`

#### Test 3.3: Profile Load with Network Error
- [ ] Login successfully
- [ ] Disconnect internet
- [ ] Navigate to `index.html`
- [ ] Verify error is handled gracefully
- [ ] Verify user is not redirected to login (unless 401)

### 4. Protected Pages

#### Test 4.1: Access Protected Page Without Token
- [ ] Clear `sessionStorage` completely
- [ ] Navigate directly to `index.html`
- [ ] Verify redirect to `login.html`

#### Test 4.2: Access Protected Page With Expired Token
- [ ] Set expired token in `sessionStorage`
- [ ] Navigate to `index.html`
- [ ] Verify 401 error is handled
- [ ] Verify redirect to `login.html`
- [ ] Verify `sessionToken` is cleared

#### Test 4.3: Access Auth Pages With Valid Token
- [ ] Login successfully
- [ ] Navigate to `login.html`
- [ ] Verify user can access login page (no redirect)
- [ ] Navigate to `signup.html`
- [ ] Verify user can access signup page (no redirect)

### 5. Session Management

#### Test 5.1: Session Persistence
- [ ] Login successfully
- [ ] Verify `sessionToken` is stored in `sessionStorage` (not `localStorage`)
- [ ] Refresh the page
- [ ] Verify user remains logged in
- [ ] Verify profile is loaded again

#### Test 5.2: Session Clearing
- [ ] Login successfully
- [ ] Manually clear `sessionStorage`: `sessionStorage.clear()`
- [ ] Refresh the page
- [ ] Verify redirect to `login.html`

#### Test 5.3: Logout (if implemented)
- [ ] Login successfully
- [ ] Click logout button (if available)
- [ ] Verify `sessionToken` is cleared
- [ ] Verify `currentUser` is cleared
- [ ] Verify redirect to `login.html`

### 6. Error Handling

#### Test 6.1: JSON Parse Error
- [ ] Mock server to return invalid JSON
- [ ] Attempt login
- [ ] Verify error is handled gracefully
- [ ] Verify user-friendly error message is displayed

#### Test 6.2: Missing Response Fields
- [ ] Mock server to return response without expected fields
- [ ] Attempt login
- [ ] Verify error is handled gracefully
- [ ] Verify no JavaScript errors in console

#### Test 6.3: Server Error (500)
- [ ] Mock server to return 500 error
- [ ] Attempt login
- [ ] Verify error message is displayed
- [ ] Verify user is not redirected

### 7. UI Updates

#### Test 7.1: Greeting Update
- [ ] Login with user named "John Doe"
- [ ] Navigate to dashboard
- [ ] Verify greeting shows "Good [Time], John"
- [ ] Verify time of day is correct (Morning/Afternoon/Evening)

#### Test 7.2: User Name Update
- [ ] Login with user
- [ ] Navigate to dashboard
- [ ] Verify user name in navbar shows full name
- [ ] Check all instances of `.user-name` element are updated

#### Test 7.3: Avatar Update
- [ ] Login with user "John Doe"
- [ ] Navigate to dashboard
- [ ] Verify avatar shows initials "JD"
- [ ] Verify avatar is uppercase

#### Test 7.4: Profile Picture (if available)
- [ ] Login with user that has profile picture
- [ ] Navigate to dashboard
- [ ] Verify profile picture is displayed (if URL is valid)
- [ ] Verify fallback to initials if picture fails to load

### 8. Browser Compatibility

#### Test 8.1: Chrome
- [ ] Test all scenarios in Chrome
- [ ] Verify no console errors
- [ ] Verify all functionality works

#### Test 8.2: Firefox
- [ ] Test all scenarios in Firefox
- [ ] Verify no console errors
- [ ] Verify all functionality works

#### Test 8.3: Safari
- [ ] Test all scenarios in Safari
- [ ] Verify no console errors
- [ ] Verify all functionality works

#### Test 8.4: Edge
- [ ] Test all scenarios in Edge
- [ ] Verify no console errors
- [ ] Verify all functionality works

### 9. Mobile Responsiveness

#### Test 9.1: Mobile Login
- [ ] Open login page on mobile device
- [ ] Verify form is usable
- [ ] Verify validation works
- [ ] Verify error messages are visible

#### Test 9.2: Mobile Dashboard
- [ ] Login on mobile device
- [ ] Verify profile data loads
- [ ] Verify greeting is visible
- [ ] Verify user name is visible

## Manual Test Steps

### Quick Smoke Test

1. **Login Test**
   ```
   1. Go to login.html
   2. Enter valid credentials
   3. Click Sign In
   4. Verify redirect to index.html
   5. Verify greeting shows user name
   ```

2. **Profile Load Test**
   ```
   1. Already logged in
   2. Go to index.html
   3. Open browser DevTools → Network tab
   4. Verify GET /get-profile request is made
   5. Verify request includes Authorization header
   6. Verify response contains user profile
   7. Verify UI is updated with profile data
   ```

3. **Protected Page Test**
   ```
   1. Clear sessionStorage
   2. Go to index.html
   3. Verify redirect to login.html
   ```

4. **Signup Test**
   ```
   1. Go to signup.html
   2. Fill in all fields
   3. Submit form
   4. Verify auto-login (if enabled)
   5. Verify redirect to index.html
   ```

## Expected Behavior Summary

- ✅ Login stores `sessionToken` and `currentUser` in `sessionStorage`
- ✅ Profile loads automatically on protected pages
- ✅ UI updates with user's name and avatar
- ✅ 401 errors clear session and redirect to login
- ✅ Network errors show user-friendly messages
- ✅ Form validation works before submission
- ✅ Loading states are shown during API calls
- ✅ Protected pages redirect to login if no token
- ✅ Auth pages (login/signup) are accessible with or without token

## Common Issues to Check

1. **Script Load Order**: Ensure `api.js` loads before `login.js`, `signup.js`, and `main.js`
2. **CORS Errors**: Check browser console for CORS issues
3. **Token Format**: Verify token is stored correctly in `sessionStorage`
4. **API Base URL**: Verify `BASE` constant in `api.js` matches your Supabase project
5. **Response Format**: Verify Edge Functions return expected JSON format
6. **DOM Elements**: Verify HTML has elements with correct classes/IDs for profile updates

## Notes

- All tokens are stored in `sessionStorage` (not `localStorage`) for security
- Passwords are never stored persistently
- Error messages should be user-friendly and not expose technical details
- Network errors should provide clear guidance to users
- Loading states should be visible during API calls
- Form validation should prevent invalid submissions

