# Cookie Structure for Argus Authentication

This document describes the authentication cookie used by the Argus backend for user sessions. Use this structure to integrate with other servers or services.

---

## Cookie Name

- **auth_token**

## Value

- JWT token string (signed with HS256)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Cookie Attributes

| Attribute | Value                    | Description                           |
| --------- | ------------------------ | ------------------------------------- |
| key       | auth_token               | Name of the cookie                    |
| value     | <JWT token>              | JWT string                            |
| httponly  | true                     | Not accessible via JavaScript         |
| secure    | false (dev), true (prod) | Only sent over HTTPS in production    |
| samesite  | strict                   | Prevents CSRF, only sent to same site |
| max_age   | 2678400 (31 days)        | Cookie expiration in seconds          |
| path      | /                        | Available to all routes               |

---

## Example Set-Cookie Header

```
Set-Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; SameSite=Strict; Max-Age=2678400; Secure
```

---

## Usage in Requests

- The cookie is automatically sent by browsers when making requests to the backend.
- For server-to-server requests, include the cookie in the request headers:

**Python Example:**

```python
import requests
cookies = {'auth_token': 'your-jwt-token-here'}
response = requests.get('https://your-backend-url/api', cookies=cookies)
```

---

## Notes

- The JWT token contains user identification and is signed with the backend's `JWT_SECRET`.
- Always use `secure=True` in production.
- The cookie is set on login and cleared on logout.
- For cross-origin requests, ensure CORS and cookie forwarding are configured.

---

## JWT Structure

The JWT token stored in the `auth_token` cookie contains the following payload:

```json
{
  "id": "<user_uuid>",
  "email": "<user_email>",
  "exp": <expiration_timestamp>
}
```

- **id**: Unique user identifier (UUID)
- **email**: User's email address
- **exp**: Expiration timestamp (Unix epoch, UTC)

**Header:**

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Signature:**

- Signed with backend `JWT_SECRET` using HS256 algorithm

---

## Example JWT Payload

```json
{
  "id": "c1a2b3d4-5678-90ab-cdef-1234567890ab",
  "email": "user@example.com",
  "exp": 1750000000
}
```

---

_Reference: backend/routes/auth.py_
