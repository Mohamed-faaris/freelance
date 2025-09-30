# PostgreSQL Installation and Setup Guide

## 1. Install PostgreSQL Dependencies

```bash
pip install sqlalchemy psycopg2-binary asyncpg alembic
```

## 2. Install and Setup PostgreSQL Database

### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install PostgreSQL with default settings
3. Remember the password you set for the 'postgres' user
4. PostgreSQL will run on port 5432 by default

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 3. Create Database and User

Connect to PostgreSQL as superuser:
```bash
psql -U postgres
```

Create database and user:
```sql
CREATE DATABASE freelance_db;
CREATE USER your_db_username WITH ENCRYPTED PASSWORD 'your_db_password';
GRANT ALL PRIVILEGES ON DATABASE freelance_db TO your_db_username;
ALTER USER your_db_username CREATEDB;
\q
```

## 4. Update Environment Variables

Update your `.env` file with PostgreSQL credentials:
```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://your_db_username:your_db_password@localhost:5432/freelance_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freelance_db
DB_USER=your_db_username
DB_PASSWORD=your_db_password
```

## 5. Database Migration Steps

1. **Install new dependencies:**
   ```bash
   pip install -r postgresql_requirements.txt
   ```

2. **Test PostgreSQL connection:**
   ```python
   from config.database import test_connection
   import asyncio
   asyncio.run(test_connection())
   ```

3. **Initialize database tables:**
   ```python
   from config.database import init_db
   import asyncio
   asyncio.run(init_db())
   ```

4. **Migrate existing data (if you have MongoDB data):**
   ```bash
   python scripts/migrate_to_postgresql.py
   ```

## 6. Key Changes Made

### Database Configuration (`config/database.py`)
- SQLAlchemy engine setup
- Session management
- Connection pooling
- Database initialization

### Models (`models/database_models.py`)
- User model with PostgreSQL schema
- APIAnalytics model
- Relationships and foreign keys
- JSON fields for complex data

### Repositories (`repositories/database_repository.py`)
- UserRepository for user operations
- AnalyticsRepository for analytics
- Backward compatibility functions

### Updated Routes
- PostgreSQL-compatible user routes
- Dependency injection for database sessions
- Error handling and validation

## 7. Usage Examples

### Creating a User:
```python
from repositories.database_repository import UserRepository
from config.database import SessionLocal

db = SessionLocal()
user_repo = UserRepository(db)

user_data = {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "hashed_password",
    "role": "user"
}

user = await user_repo.create_user(user_data)
```

### Querying Users:
```python
# Get user by email
user = await user_repo.get_user_by_email("john@example.com")

# Get all users
users = await user_repo.get_all_users()
```

## 8. Advantages of PostgreSQL Migration

1. **ACID Compliance**: Full transaction support
2. **Better Performance**: Optimized queries and indexing
3. **Data Integrity**: Foreign keys and constraints
4. **Scalability**: Better handling of concurrent connections
5. **Advanced Features**: JSON support, full-text search, etc.
6. **Backup & Recovery**: Built-in tools for data protection

## 9. Migration Checklist

- [ ] Install PostgreSQL server
- [ ] Install Python dependencies
- [ ] Update environment variables
- [ ] Test database connection
- [ ] Initialize database tables
- [ ] Migrate existing data
- [ ] Update application routes
- [ ] Test all endpoints
- [ ] Update deployment scripts

## 10. Rollback Plan

If you need to rollback to MongoDB:
1. Keep the original MongoDB connection in `config/db.py`
2. Switch imports in `routes/main.py`
3. Revert environment variables
4. The migration script preserves all original data