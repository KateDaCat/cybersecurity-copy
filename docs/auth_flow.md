## Auth Flow Integration

Use JSON requests from the frontend screens to the existing backend endpoints described below. All endpoints live under the `/auth` route mounted in `server.js`.

---

### 1. Sign-up Screen → `POST /auth/register`

**Request body**

```json
{
  "email": "user@example.com",
  "username": "optionalAlias",
  "password": "PlaintextPassword",
  "role_id": 3
}
```

- `email` and `password` are required; `username` and `role_id` are optional (default role is `null` → public until admin assigns).
- Passwords are hashed with bcrypt before storage; email/username are encrypted + indexed for lookups.

**Success response**

```json
{
  "ok": true,
  "user_id": 123
}
```

**Failure response**

```json
{
  "ok": false,
  "message": "email and password are required"
}
```

Show the returned `message` to the user when `ok` is `false`.

---

### 2. Login Screen → `POST /auth/login`

**Request body**

```json
{
  "email": "user@example.com",
  "password": "PlaintextPassword"
}
```

- The backend verifies the password with bcrypt and decrypts the stored email to send an MFA code.
- On success the server stores `session.mfaPendingUser = { id, role_id }`.

**Success response**

```json
{
  "ok": true,
  "mfa_required": true,
  "code_sent_to": "us***r@example.com"
}
```

Use `code_sent_to` to display the masked email on the MFA screen.

**Failure response (bad credentials, locked account, etc.)**

```json
{
  "ok": false,
  "message": "Invalid email or password"
}
```

Keep the login screen visible and surface the `message` text.

---

### 3. MFA Screen → `POST /auth/verify-mfa`

**Request body**

```json
{
  "code": "6-digit-code"
}
```

- The user must verify within the same session created by the login request (cookies must be kept).
- On success, the backend moves the user into `session.user = { id, role_id }` and sets `session.mfaVerified = true`.

**Success response**

```json
{
  "ok": true,
  "logged_in": true
}
```

Transition the UI to the authenticated area/dashboards.

**Failure responses**

```json
{
  "ok": false,
  "message": "Incorrect code"
}
```

For `401` with `"No login in progress"`, send the user back to the login screen.

---

### 4. Fetch Current User → `GET /auth/me`

Requires the session cookie **and** successful MFA. Returns decrypted email/username.

**Success response**

```json
{
  "ok": true,
  "user": {
    "id": 123,
    "role_id": 2,
    "email": "user@example.com",
    "username": "optionalAlias"
  }
}
```

If MFA hasn’t been completed, the route responds with `401 { "ok": false, "message": "MFA required" }`.

---

### 5. Logout → `POST /auth/logout`

Destroys the session and returns `{ "ok": true }`. Call this when the user hits “Sign out”.

---

### Frontend Notes

- Include `credentials: "include"` on fetch/axios calls so cookies (sessions) persist.
- Handle `401|403` by redirecting to the appropriate screen (login or MFA).
- Rate-limit login attempts on the frontend to avoid spamming the backend.
- MFA codes expire based on `MFA_CODE_TTL_MS` (default 5 minutes). Surface a timeout message accordingly.
