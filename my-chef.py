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


load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS"))


def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    payload = {"sub": str(user_id), "exp": expire}

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


app = FastAPI()

security = HTTPBearer()
databasemodel.base.metadata.create_all(bind=engine)


def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="ivalid payload"
            )
        return int(user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials/Token expired",
        )


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
        return "success"
    return "failed"


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
        return "success"
    return "error"


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
    return "error"


@app.post("/recipe")
def create_recipe(
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
        recipe = chef.cook(
            db_prefrences.diet_type, db_prefrences.allergies, ingredients
        )
        recipe.user_id = User_id
        db_recipeinfo = databasemodel.recipe_info(**recipe.model_dump())
        db.add(db_recipeinfo)
        db.commit()
        return "success"
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
