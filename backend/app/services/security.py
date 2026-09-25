import base64
import hashlib
import hmac
import os

import jwt

from ..config import get_settings

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return "$".join(("scrypt", base64.b64encode(salt).decode(), base64.b64encode(digest).decode()))


def verify_password(password: str, password_hash: str) -> bool:
    scheme, encoded_salt, encoded_digest = password_hash.split("$", 2)
    if scheme != "scrypt":
        return False
    salt = base64.b64decode(encoded_salt)
    expected = base64.b64decode(encoded_digest)
    actual = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return hmac.compare_digest(actual, expected)


def create_token(user_id: int) -> str:
    return jwt.encode({"sub": str(user_id)}, get_settings().jwt_secret, algorithm="HS256")
