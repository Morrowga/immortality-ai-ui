from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.db.session import get_db
from app.models.user import User, AgentProfile, AgentLifecycle, StyleProfile
from app.core.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    language: str = "en"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        name=data.name,
        hashed_password=hash_password(data.password),
        language=data.language,
    )
    db.add(user)
    await db.flush()

    agent = AgentProfile(user_id=user.id, agent_name=f"{data.name}'s Agent")
    db.add(agent)
    await db.flush()

    db.add(AgentLifecycle(agent_id=agent.id, user_id=user.id))
    db.add(StyleProfile(user_id=user.id, agent_id=agent.id, language_primary=data.language))
    await db.commit()

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "name": user.name,
        "language": user.language,          # ← added
        "agent_id": str(agent.id),
    }


@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    result = await db.execute(select(AgentProfile).where(AgentProfile.user_id == user.id))
    agent = result.scalar_one_or_none()

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "name": user.name,
        "language": user.language,          # ← was missing — caused frontend hardcode bug
        "agent_id": str(agent.id) if agent else "",
    }


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "language": current_user.language,
    }