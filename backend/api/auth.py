from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from ..database.connection import get_db
from ..database import models
from ..services.auth_service import verify_password, get_password_hash, create_access_token, decode_access_token

router = APIRouter()
security = HTTPBearer()


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/auth/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Validate passwords match
    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Validate password strength
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Validate role
    allowed_roles = ["Pharmacist", "Prescriber/Doctor"]
    if request.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {', '.join(allowed_roles)}")

    # Check duplicate email
    existing = db.query(models.User).filter(models.User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_pw = get_password_hash(request.password)
    user = models.User(
        name=request.name,
        email=request.email,
        password_hash=hashed_pw,
        role=request.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log audit
    audit = models.AuditLog(
        user_email=request.email,
        user_role=request.role,
        action="USER_REGISTERED",
        details=f"New user registered: {request.name}"
    )
    db.add(audit)
    # Seed demo data for new user
    from ..services.seed import seed_user_data
    try:
        seed_user_data(user.id, user.email, user.role, db)
    except Exception as e:
        print(f"Error seeding user data: {e}")

    return {"message": "Account created successfully. Please sign in."}


@router.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    token = create_access_token({"sub": user.email})

    # Log audit
    audit = models.AuditLog(
        user_email=user.email,
        user_role=user.role,
        action="USER_LOGIN",
        details="User signed in"
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@router.get("/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }


@router.post("/auth/logout")
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Log audit
    audit = models.AuditLog(
        user_email=current_user.email,
        user_role=current_user.role,
        action="USER_LOGOUT",
        details="User signed out"
    )
    db.add(audit)
    db.commit()
    return {"message": "Logged out successfully"}
