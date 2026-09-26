from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    try:
        import uuid
        user_id = uuid.UUID(user_id_str)
    except Exception:
        return None
    return db.query(User).filter(User.id == user_id).first()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(req: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    hashed = hash_password(req.password)
    user = User(
        email=req.email.lower().strip(),
        hashed_password=hashed,
        full_name=req.full_name.strip(),
        role=req.role or "analyst",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    user_out = UserOut.model_validate(user)
    token = create_access_token({"sub": str(user.id), "email": user.email})

    return Token(access_token=token, token_type="bearer", user=user_out)


@router.post("/login", response_model=Token)
def login(req: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_out = UserOut.model_validate(user)
    token = create_access_token({"sub": str(user.id), "email": user.email})

    return Token(access_token=token, token_type="bearer", user=user_out)


@router.get("/me", response_model=UserOut)
def get_me(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return UserOut.model_validate(current_user)
