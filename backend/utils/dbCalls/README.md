# Database Calls Utilities

This directory contains organized database operations extracted from route handlers. All database interactions have been centralized here for better maintainability, reusability, and testing.

## Structure

### `user_db.py`
Contains all user-related database operations:
- `find_user_by_id(user_id)` - Find user by ObjectId
- `find_user_by_email(email)` - Find user by email address
- `find_user_by_username(username)` - Find user by username
- `find_all_users()` - Get all users
- `create_user(user_data)` - Create new user with timestamps and password hashing
- `update_user(user_id, update_data)` - Update user with timestamps and password hashing
- `delete_user(user_id)` - Delete user by ID
- `check_email_exists(email)` - Check if email exists
- `check_username_exists(username)` - Check if username exists

### `analytics_db.py`
Contains all analytics-related database operations:
- `get_analytics_total_usage(filter_dict)` - Get aggregated total usage stats
- `get_analytics_daily_usage(filter_dict)` - Get daily usage breakdown
- `get_analytics_service_breakdown(filter_dict)` - Get service usage breakdown
- `get_analytics_user_usage(filter_dict, limit)` - Get top user usage stats
- `get_analytics_profile_type_counts(filter_dict)` - Get profile type statistics
- `get_analytics_top_endpoints(filter_dict, limit)` - Get most used endpoints
- `get_analytics_logs_paginated(filter_dict, page, limit)` - Get paginated logs
- `count_analytics_logs(filter_dict)` - Count matching log entries
- `log_api_call(log_data)` - Insert new API call log
- `build_analytics_filter(...)` - Build MongoDB filter for analytics queries
- `format_analytics_logs_for_response(logs_list)` - Format logs for API response

### `auth_db.py`
Contains authentication-specific database operations:
- `authenticate_user_by_email(email)` - Get user for login authentication
- `get_user_for_token_validation(user_id)` - Get user for token validation
- `check_user_exists_by_email(email)` - Check email existence for registration
- `check_user_exists_by_username(username)` - Check username existence for registration
- `insert_new_user(user_data)` - Insert new user and return ID

### `common.py`
Contains common database utilities:
- `parse_date_with_fallback(date_str, fallback_days)` - Parse ISO dates with fallback
- `format_end_date(date)` - Format date to end of day
- `serialize_object_ids(data)` - Convert ObjectIds to strings for JSON
- `calculate_pagination_info(total_count, page, limit)` - Calculate pagination metadata
- `validate_object_id(id_str)` - Validate ObjectId string format

## Usage Examples

### User Operations
```python
from utils.dbCalls import find_user_by_id, create_user, check_email_exists

# Find user
user = await find_user_by_id("507f1f77bcf86cd799439011")

# Check if email exists before creating user
if await check_email_exists("user@example.com"):
    raise HTTPException(status_code=400, detail="Email already exists")

# Create new user
user_data = {"username": "john", "email": "john@example.com", "password": "secret"}
new_user = await create_user(user_data)
```

### Analytics Operations
```python
from utils.dbCalls import (
    build_analytics_filter, 
    get_analytics_total_usage,
    get_analytics_logs_paginated
)

# Build filter for date range
filter_dict = build_analytics_filter(
    start_date=datetime.now() - timedelta(days=30),
    end_date=datetime.now(),
    service="verification",
    user_id="507f1f77bcf86cd799439011"
)

# Get total usage stats
total_stats = await get_analytics_total_usage(filter_dict)

# Get paginated logs
logs = await get_analytics_logs_paginated(filter_dict, page=1, limit=100)
```

### Authentication Operations
```python
from utils.dbCalls import authenticate_user_by_email, get_user_for_token_validation

# Login authentication
user = await authenticate_user_by_email("user@example.com")
if user and verify_password(password, user["password"]):
    # Generate token...

# Token validation
user = await get_user_for_token_validation(user_id_from_token)
if not user:
    raise HTTPException(status_code=401, detail="User not found")
```

## Migration Notes

All route handlers have been updated to use these centralized database functions instead of direct collection operations. This provides:

1. **Consistency** - Standardized error handling and data formatting
2. **Reusability** - Functions can be used across multiple routes
3. **Maintainability** - Database logic is centralized and easier to modify
4. **Testing** - Individual database operations can be easily unit tested
5. **Security** - Consistent data validation and sanitization

## Error Handling

All database functions handle exceptions appropriately:
- Return `None` for not found operations
- Raise appropriate exceptions for invalid data
- Log errors where necessary
- Handle ObjectId conversion errors gracefully