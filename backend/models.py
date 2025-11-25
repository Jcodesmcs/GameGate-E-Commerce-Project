import hashlib
from typing import Dict, Any
from database import db

class User:
    def __init__(self, user_id: int, username: str, email: str, role: str):
        self.id = user_id
        self.username = username
        self.email = email
        self.role = role

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role
        }

    @staticmethod
    def hash_password(password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

class GameItem:
    def __init__(self, item_id: int, name: str, description: str, price: float, 
                 currency: str = "PHP", game_platform: str = None, created_at: str = None):
        self.id = item_id
        self.name = name
        self.description = description
        self.price = price
        self.currency = currency
        self.game_platform = game_platform
        self.created_at = created_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "currency": self.currency,
            "game_platform": self.game_platform,
            "created_at": self.created_at
        }

class Transaction:
    def __init__(self, transaction_id: int, user_id: int, item_id: int, status: str, 
                 final_price: float, quantity: int = 1, created_at: str = None):
        self.id = transaction_id
        self.user_id = user_id
        self.item_id = item_id
        self.status = status
        self.final_price = final_price
        self.quantity = quantity
        self.created_at = created_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "item_id": self.item_id,
            "status": self.status,
            "final_price": float(self.final_price),
            "quantity": self.quantity,
            "created_at": self.created_at
        }