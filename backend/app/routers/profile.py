import re

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from .. import db
from ..auth import create_token, current_user
from ..models import (
    ProfilePasswordChange,
    ProfileUpdate,
    ProfileUpdateResponse,
    UserProfile,
)

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _profile_from_row(row: dict) -> UserProfile:
    return UserProfile(
        username=row["username"],
        role=row["role"],
        email=row.get("email"),
        avatarUrl=row.get("avatarUrl"),
        createdAt=row.get("createdAt"),
        lastLogin=row.get("lastLogin"),
    )


@router.get("/me", response_model=UserProfile)
async def get_my_profile(user: dict = Depends(current_user)):
    row = db.get_user(user["username"])
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _profile_from_row(row)


@router.patch("/me", response_model=ProfileUpdateResponse)
async def update_my_profile(body: ProfileUpdate, user: dict = Depends(current_user)):
    username = user["username"]
    token: str | None = None
    row = db.get_user(username)
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")

    if body.username is not None:
        new_name = body.username.strip()
        if new_name != username:
            try:
                updated = db.rename_user(username, new_name)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e)) from e
            if updated is None:
                raise HTTPException(status_code=404, detail="User not found")
            username = updated["username"]
            token = create_token(username, user["role"])
            db.add_audit(username, "profile.username", f"renamed from {user['username']}")

    if body.email is not None:
        email = body.email.strip() or None
        if email and not _EMAIL_RE.match(email):
            raise HTTPException(status_code=422, detail="Enter a valid email address.")
        updated = db.update_email(username, email)
        if updated is None:
            raise HTTPException(status_code=404, detail="User not found")
        db.add_audit(username, "profile.email", "updated")

    row = db.get_user(username)
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return ProfileUpdateResponse(profile=_profile_from_row(row), token=token)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_my_password(
    body: ProfilePasswordChange, user: dict = Depends(current_user)
):
    if len(body.newPassword) < 6:
        raise HTTPException(status_code=422, detail="New password must be at least 6 characters.")
    try:
        ok = db.change_password(user["username"], body.currentPassword, body.newPassword)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    if not ok:
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    db.add_audit(user["username"], "profile.password", "changed")


@router.post("/avatar", response_model=UserProfile)
async def upload_avatar(
    file: UploadFile = File(...),
    user: dict = Depends(current_user),
):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file.")
    try:
        avatar_url = db.save_avatar(user["username"], content, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    db.add_audit(user["username"], "profile.avatar", "uploaded")
    row = db.get_user(user["username"])
    return _profile_from_row(row or {"username": user["username"], "role": user["role"], "avatarUrl": avatar_url})


@router.delete("/avatar", response_model=UserProfile)
async def remove_avatar(user: dict = Depends(current_user)):
    db.delete_avatar(user["username"])
    db.add_audit(user["username"], "profile.avatar", "removed")
    row = db.get_user(user["username"])
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _profile_from_row(row)
