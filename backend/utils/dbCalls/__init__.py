"""
Database calls utilities package.

This package contains organized database operations extracted from route handlers.
All database interactions should be centralized here for better maintainability,
reusability, and testing.
"""

from .user_db import *
from .analytics_db import *
from .auth_db import *
from .common import *

__all__ = [
    # User operations
    'find_user_by_id',
    'find_user_by_email',
    'find_user_by_username',
    'find_all_users',
    'create_user',
    'update_user',
    'delete_user',
    'check_email_exists',
    'check_username_exists',
    'validate_user_password',
    'get_user_with_model',
    'check_user_permissions',
    'find_users_by_query',
    'update_user_role_resources',
    'create_bitfield_from_permissions',
    'get_role_from_bits',
    'permissions_from_int_with_admin',
    
    # Analytics operations
    'get_analytics_total_usage',
    'get_analytics_daily_usage',
    'get_analytics_service_breakdown',
    'get_analytics_user_usage',
    'get_analytics_profile_type_counts',
    'get_analytics_top_endpoints',
    'get_analytics_logs_paginated',
    'count_analytics_logs',
    'log_api_call',
    'create_analytics_entry',
    'build_analytics_filter',
    'format_analytics_logs_for_response',
    
    # Auth operations
    'authenticate_user_by_email',
    'get_user_for_token_validation',
    'check_user_exists_by_email',
    'check_user_exists_by_username',
    'insert_new_user',
    
    # Common utilities
    'parse_date_with_fallback',
    'format_end_date',
    'serialize_object_ids',
    'calculate_pagination_info',
    'validate_object_id',
]