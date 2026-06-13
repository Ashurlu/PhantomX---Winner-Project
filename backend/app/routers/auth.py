from fastapi import APIRouter, HTTPException, status

from .. import db
from ..auth import authenticate, create_token
from ..models import LoginRequest, LoginResponse, SignupRequest

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    role = authenticate(body.username, body.password)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = create_token(body.username, role)
    db.touch_login(body.username)
    db.add_audit(body.username, "auth.login", f"role={role}")
    return LoginResponse(token=token, role=role, username=body.username)


@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    username = body.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=422, detail="Username must be at least 3 characters")
    if len(body.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")

    # New accounts are analysts; an admin promotes them later (defense in depth).
    created = db.create_user(username, body.password, role="analyst")
    if created is None:
        raise HTTPException(status_code=409, detail="Username already taken")

    # Auto sign-in after signup.
    db.touch_login(username)
    db.add_audit(username, "auth.signup", "self-registered as analyst")
    token = create_token(username, "analyst")
    return LoginResponse(token=token, role="analyst", username=username)
