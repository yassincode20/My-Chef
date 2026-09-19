import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import databasemodel
from database import engine, session
from usermodel import User, User_Login, User_Prefrences
import bcrypt
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import timedelta, timezone, datetime
import chef
from typing import Optional
import asyncio


load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS"))


def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    payload = {"sub": str(user_id), "exp": expire}

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


app = FastAPI()

security = HTTPBearer(auto_error=False)
databasemodel.base.metadata.create_all(bind=engine)


def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()


def get_current_useroptional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):

    if not credentials:
        return None

    # credentials.credentials is the raw string token FastAPI grabbed for you
    token_string = credentials.credentials

    try:
        # Turn the encrypted string back into a Python dictionary
        payload = jwt.decode(token_string, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            return None  # Token is valid JWT, but missing the "sub" claim

        return int(user_id)

    except JWTError:
        # Token was manipulated, fake, or expired
        return None


strict_security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(strict_security),
):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    try:
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
            )
        return int(user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="unathorized/bad token"
        )


@app.post("/register")
def creat_user(user: User, db: Session = Depends(get_db)):
    try:
        hashed_password = bcrypt.hashpw(
            user.password.encode("utf-8"), bcrypt.gensalt(4)
        )
        new_user = databasemodel.user(
            username=user.user_name,
            name=user.name,
            email=user.email,
            password_hash=hashed_password.decode("utf-8"),
        )
        db.add(new_user)
        db.commit()
        return user
    except IntegrityError:
        db.rollback()
        return {"error": "Username or email already exists"}


@app.post("/login")
def user_login(
    user_login: User_Login,
    db: Session = Depends(get_db),
    User_id: Optional[int] = Depends(get_current_useroptional),
):
    db_user = (
        db.query(databasemodel.user)
        .filter(
            (databasemodel.user.username == user_login.login)
            | (databasemodel.user.email == user_login.login)
        )
        .first()
    )
    if db_user:
        if User_id == db_user.id:
            return {"legit": "True"}

        user_attempt = user_login.password.encode("utf-8")
        db_hash = db_user.password_hash.encode("utf-8")
        if bcrypt.checkpw(user_attempt, db_hash):
            access_token = create_access_token(db_user.id)
            return {f"access_token": access_token, "token_type": "bearer"}

    return "user not found due invalid data"


@app.post("/userprefrences")
def get_prefrences(
    prefrences: User_Prefrences,
    db: Session = Depends(get_db),
    User_id: int = Depends(get_current_user),
):

    db_user = (
        db.query(databasemodel.user).filter(databasemodel.user.id == User_id).first()
    )
    if db_user:
        new_prefrence = databasemodel.User_Prefrences(
            **prefrences.model_dump(), user_id=User_id
        )
        db.add(new_prefrence)
        db.commit()
        return {"response": "success"}
    return {"respone": "failed"}


@app.put("/userprefrences")
def edit_prefrences(
    updated_prefrence: User_Prefrences,
    db: Session = Depends(get_db),
    User_id: int = Depends(get_current_user),
):
    db_prefrence = (
        db.query(databasemodel.User_Prefrences)
        .filter(databasemodel.User_Prefrences.user_id == User_id)
        .first()
    )
    if db_prefrence:
        db_prefrence.diet_type = updated_prefrence.diet_type
        db_prefrence.allergies = updated_prefrence.allergies
        db.add(db_prefrence)
        db.commit()
        return {"response": "success"}
    return {"response": "failed"}


@app.get("/userprefrences")
def get_prefrences(
    User_id: int = Depends(get_current_user), db: Session = Depends(get_db)
):
    db_prefrence = (
        db.query(databasemodel.User_Prefrences)
        .filter(databasemodel.User_Prefrences.user_id == User_id)
        .first()
    )

    if db_prefrence:
        prefrences = User_Prefrences(
            diet_type=db_prefrence.diet_type, allergies=db_prefrence.allergies
        )

        return prefrences
    return {"response": "failed"}


@app.post("/recipe")
async def create_recipe(
    ingredients: str,
    User_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_prefrences = (
        db.query(databasemodel.User_Prefrences)
        .filter(databasemodel.User_Prefrences.user_id == User_id)
        .first()
    )
    if db_prefrences:
        recipe = await chef.cook(
            db_prefrences.diet_type, db_prefrences.allergies, ingredients
        )

        recipe.user_id = User_id
        db_recipeinfo = databasemodel.recipe_info(**recipe.model_dump())
        db.add(db_recipeinfo)
        db.commit()
        return db_recipeinfo.name, db_recipeinfo.recipe
    return "error"


@app.get("/recipe")
def get_recipe(db: Session = Depends(get_db), User_id: int = Depends(get_current_user)):
    db_recipe = (
        db.query(databasemodel.recipe_info)
        .filter(databasemodel.recipe_info.user_id == User_id)
        .all()
    )
    if db_recipe:
        return db_recipe
    return []
