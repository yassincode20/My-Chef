import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
import databasemodel
from database import engine, session
from usermodel import User, User_Login
import bcrypt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from jose import jwt
from datetime import timedelta, timezone, datetime

load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {"sub": str(user_id), "exp": expire}

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


app = FastAPI()
databasemodel.base.metadata.create_all(bind=engine)


def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()


@app.post("/register")
def creat_user(user: User, db: Session = Depends(get_db)):
    try:
        hashed_password = bcrypt.hashpw(
            user.password.encode("utf-8"), bcrypt.gensalt(12)
        )
        new_user = databasemodel.user(
            username=user.user_name,
            name=user.name,
            email=user.email,
            password_hash=hashed_password.decode("utf-8"),
        )
        db.add(new_user)
        db.commit()
        return f"user info: {new_user.id} {new_user.name}"
    except IntegrityError:
        db.rollback()
        return {"error": "Username or email already exists"}


@app.post("/login")
def user_login(user_login: User_Login, db: Session = Depends(get_db)):
    db_user = (
        db.query(databasemodel.user)
        .filter(
            (databasemodel.user.username == user_login.login)
            | (databasemodel.user.email == user_login.login)
        )
        .first()
    )
    user_attempt = user_login.password.encode("utf-8")
    if db_user:
        db_hash = db_user.password_hash.encode("utf-8")
        if bcrypt.checkpw(user_attempt, db_hash):
            access_token = create_access_token(db_user.id)
            return {f"access token": access_token, "token_type": "bearer"}

    return "user not found due invalid data"
