# JWT-Based Authentication Refactoring Plan

## Overview

Migrate from database-backed authentication with password hashing to stateless JWT token validation using permission bits from an external auth server.

**Key Changes:**

- Remove all password handling and user authentication endpoints
- Decode JWT from cookies (external auth server responsibility)
- Use only `permissionBits` from JWT payload for authorization
- No database lookups for authentication

---

## JWT Token Structure (Expected)

```json
{
  "userId": "65ba6480-891a-4a2f-a0f6-e7be99b9d8ad",
  "sessionId": "b1bc70b5-8765-4747-83e6-10eab8caf8bb",
  "roleId": "eef43333-7e41-4e1e-ac58-719cd9f5abf1",
  "permissionBits": "1",
  "iat": 1763247881,
  "exp": 1763334281
}
```

**Environment Variables Required:**

```
JWT_SECRET="b6niDsPpAQgeC/1YOQgyRvQAyW9rIRyATzJ5z7gHzMA="
JWT_ALGORITHM="HS256"
```

---

## Phase 1: Remove Database Authentication (Multi-Step)

### Step 1.1: Remove Password Handling

**Files to modify:**

- `models/user.py` - Delete `hash_password()` and `verify_password()` methods
- `models/user.py` - Remove `password` field from User model
- `schemas/user.py` - Remove `password` field from schemas
- `routes/user/index.py` - Remove password hashing in create/update operations

**Dependencies to remove:**

- `bcrypt` imports

---

### Step 1.2: Remove Authentication Endpoints

**Files to delete/modify:**

- DELETE: `routes/auth.py` (entire file)
  - Removes: `/` POST (login)
  - Removes: `/` GET (get current user - replace with JWT parsing)
  - Removes: `/` DELETE (logout)
  - Removes: `/logout` POST (logout)
  - Removes: `/register` POST (register)
- `routes/main.py` - Remove `authRouter` import and registration

---

### Step 1.3: Clean Up Models & Schemas

**Files to modify:**

- `models/user.py` - Remove `permissions` field (use JWT `permissionBits` instead)
- `schemas/user.py` - Remove `password` field
- Remove password-related validators and field descriptors

---

### Step 1.4: Remove Auth Dependencies

**Remove from imports:**

```python
import bcrypt  # Remove everywhere
```

---

## Phase 2: JWT Decoding & Token Validation

### Step 2.1: Create JWT Token Parser

**New file:** `utils/jwt_parser.py`

**Responsibilities:**

- Decode JWT from `auth_token` cookie
- Validate signature using `JWT_SECRET` and `JWT_ALGORITHM`
- Validate token expiration
- Extract payload fields:
  - `userId`
  - `sessionId`
  - `roleId`
  - `permissionBits`
  - `iat`
  - `exp`

**Return format:**

```python
{
    "userId": str,
    "sessionId": str,
    "roleId": str,
    "permissionBits": str,  # Bit flags as string
    "iat": int,
    "exp": int,
    "is_valid": bool,
    "error": str | None
}
```

---

### Step 2.2: Update `utils/auth.py`

**Current functions to modify:**

1. **`authenticate_request(request: Request) -> Dict[str, Any]`**

   - OLD: Decoded JWT + Optional None
   - NEW: Only decode JWT from cookie (no DB lookup)
   - No user lookup in database

2. **`get_authenticated_user(request: Request) -> Dict[str, Any]`**
   - OLD: Returns full user document from database
   - NEW: Returns decoded JWT payload directly
   - No HTTP exception on missing user - JWT payload is the "user"

**New signature:**

```python
async def get_authenticated_user(request: Request) -> Dict[str, Any]:
    """
    Get JWT payload from auth_token cookie.
    Returns: Decoded JWT with userId, sessionId, roleId, permissionBits, etc.
    Raises: HTTPException(401) if token missing or invalid
    """
```

---

### Step 2.3: Environment Configuration

**Verify `.env` contains:**

```
JWT_SECRET="b6niDsPpAQgeC/1YOQgyRvQAyW9rIRyATzJ5z7gHzMA="
JWT_ALGORITHM="HS256"
```

---

## Phase 3: Permission Checking (Simplified)

### Step 3.1: Remove Old Permission Logic

**Files to modify:**

- `utils/auth.py` - DELETE `validate_user_permissions()` function
- `utils/__init__.py` - Remove `validate_user_permissions` from exports

---

### Step 3.2: Implement PermissionBits Checker

**New file addition:** `utils/permissions.py`

**Permission Bit Definitions:**

```python
PERMISSION_READ = 1      # 0x001
PERMISSION_WRITE = 2     # 0x002
PERMISSION_DELETE = 4    # 0x004
PERMISSION_ADMIN = 8     # 0x008
# Add more as needed...
```

**Function:**

```python
def check_permission(decoded_jwt: Dict[str, Any], required_bits: int) -> bool:
    """
    Check if JWT has required permission bits.

    Args:
        decoded_jwt: Decoded JWT payload
        required_bits: Bit flags to check (can be OR'd together)

    Returns:
        True if (permissionBits & required_bits) != 0
    """
    try:
        bits = int(decoded_jwt.get("permissionBits", "0"))
        return (bits & required_bits) != 0
    except (ValueError, TypeError):
        return False
```

---

### Step 3.3: Update Route Guards

**Before:** Complex permission lookup

```python
await validate_user_permissions(user_doc, ["create_user", "delete_user"])
```

**After:** Simple bit check

```python
if not check_permission(decoded_jwt, PERMISSION_ADMIN):
    raise HTTPException(status_code=403, detail="Insufficient permissions")
```

---

## Implementation Sequence

### Order of Execution:

1. ✅ Create `utils/jwt_parser.py` (Phase 2.1)
2. ✅ Create `utils/permissions.py` (Phase 3.2)
3. ✅ Update `utils/auth.py` (Phase 2.2)
4. ✅ Update `utils/__init__.py` exports
5. ⏳ Remove password methods from `models/user.py` (Phase 1.1)
6. ⏳ Remove password field from `schemas/user.py` (Phase 1.1)
7. ⏳ Update `routes/user/index.py` to remove password handling (Phase 1.1)
8. ⏳ DELETE `routes/auth.py` (Phase 1.2)
9. ⏳ Remove `authRouter` from `routes/main.py` (Phase 1.2)
10. ⏳ Remove old permission function from `utils/auth.py` (Phase 3.1)
11. ⏳ Update all routes to use new JWT auth (incremental testing)
12. ⏳ Remove `bcrypt` from requirements/imports (Phase 1.4)

---

## Files Modified Summary

| Phase | File                   | Action                           | Priority |
| ----- | ---------------------- | -------------------------------- | -------- |
| 1.1   | `models/user.py`       | Remove password methods & field  | High     |
| 1.1   | `schemas/user.py`      | Remove password field            | High     |
| 1.1   | `routes/user/index.py` | Remove password hashing          | High     |
| 1.2   | `routes/auth.py`       | DELETE entire file               | High     |
| 1.2   | `routes/main.py`       | Remove authRouter import         | High     |
| 1.3   | `models/user.py`       | Remove permissions field         | Medium   |
| 1.4   | Various                | Remove bcrypt imports            | Low      |
| 2.1   | `utils/jwt_parser.py`  | CREATE new file                  | High     |
| 2.2   | `utils/auth.py`        | Update functions                 | High     |
| 2.3   | `.env`                 | Verify JWT config                | Critical |
| 3.1   | `utils/auth.py`        | Remove validate_user_permissions | Low      |
| 3.2   | `utils/permissions.py` | CREATE new file                  | High     |
| 3.3   | All routes             | Update permission checks         | Medium   |

---

## Testing Checklist

- [ ] JWT decoding works with valid token
- [ ] JWT validation fails with expired token
- [ ] JWT validation fails with invalid signature
- [ ] Permission bits check works (0x1, 0x2, 0x4, 0x8 combinations)
- [ ] All routes accept decoded JWT payload
- [ ] API returns 401 for missing auth_token cookie
- [ ] API returns 403 for insufficient permissions
- [ ] No password validation in user creation/update
- [ ] No password in user response payloads

---

## Notes

- **External Auth Server:** Password authentication is handled by external server; this backend only validates tokens
- **Stateless:** No session state stored in database
- **Forward Compatible:** If permission bits need expansion, use higher bits (16, 32, 64, etc.)
- **Rollback:** Keep git history for easy rollback if needed
