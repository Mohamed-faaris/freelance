from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User, UserUpdate
from models.database_models import User as UserModel
from config.database import get_db
from schemas.user import serializeDict, serializeList
from datetime import datetime, timezone

userRoute = APIRouter()




@userRoute.get("")
async def find_all_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel))
    users = result.scalars().all()
    return {"users": serializeList(users)}


# @user.get('/{id}')
# async def find_one_user(id):
#     return serializeDict(userCollection.find_one({"_id":ObjectId(id)}))


@userRoute.post("")
async def create_user(user: User, db: AsyncSession = Depends(get_db)):
    try:
        existing_username = await db.execute(
            select(UserModel).where(UserModel.username == user.username)
        )
        if existing_username.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already exists")

        existing_email = await db.execute(
            select(UserModel).where(UserModel.email == user.email)
        )
        if existing_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")

        now = datetime.now(timezone.utc)
        user_dict = user.model_dump()
        new_user = UserModel(
            username=user_dict["username"],
            email=user_dict["email"],
            password=User.hash_password(user_dict["password"]),
            role=user_dict.get("role", "user"),
            permissions=user_dict.get("permissions", []),
            is_active=True,
            created_at=now,
            updated_at=now,
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        return {"user": serializeDict(new_user)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@userRoute.put("/{id}")
async def update_user(id, user: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).where(UserModel.uuid == id))
    existing_user = result.scalar_one_or_none()

    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_dict = user.model_dump(exclude_unset=True)

    if "password" in user_dict and user_dict["password"]:
        existing_user.password = User.hash_password(user_dict.pop("password"))

    for field, value in user_dict.items():
        setattr(existing_user, field, value)

    existing_user.updated_at = datetime.now(timezone.utc)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate user data")

    await db.refresh(existing_user)
    return {"user": serializeDict(existing_user)}


@userRoute.delete("/{id}")
async def delete_user(id, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).where(UserModel.uuid == id))
    existing_user = result.scalar_one_or_none()

    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    response_payload = serializeDict(existing_user)
    await db.delete(existing_user)
    await db.commit()
    return response_payload
