from pydantic import BaseModel, EmailStr, ValidationError, field_validator, Field
import re

NAME_REGEX = r"^[a-zA-Z\s]+$"
USERNAME_REGEX = r"^[a-zA-Z0-9][a-zA-Z0-9._-]{2,19}$"

# Password: Min 8 chars. Must have 1 uppercase, 1 lowercase, 1 number, and 1 special character. No spaces.


class User(BaseModel):
    user_name: str = Field(pattern=USERNAME_REGEX)
    name: str = Field(pattern=NAME_REGEX, min_length=2, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=30)

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str):

        if " " in password:
            raise ValueError("Password cannot contain spaces")

        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain a lowercase letter")

        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain an uppercase letter")

        if not re.search(r"\d", password):
            raise ValueError("Password must contain a number")

        if not re.search(r'[!@#$%^&*(),.?":{}|<>_+\-]', password):
            raise ValueError("Password must contain a special character")

        return password


class User_Login(BaseModel):
    login: str
    password: str


class User_Prefrences(BaseModel):
    diet_type: str = Field(min_length=3)
    allergies: str = Field(min_length=3)


class recipe_info(BaseModel):
    user_id: int
    name: str
    recipe: str
