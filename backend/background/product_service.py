from typing import List, Dict, Any
import sys
import os
# Add parent directory to path to import main modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import db

class GameItem:
    """Represents a game currency item"""
    def __init__(self, item_id: int, name: str, price: float, description: str = "", 
                 currency: str = "PHP", game_platform: str = None, created_at: str = None):
        self.id = item_id
        self.name = name
        self.price = price
        self.description = description
        self.currency = currency
        self.game_platform = game_platform
        self.created_at = created_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "name": self.name,
            "price": float(self.price),
            "description": self.description,
            "currency": self.currency,
            "game_platform": self.game_platform,
            "created_at": self.created_at
        }

    @staticmethod
    def fetch_all() -> List['GameItem']:
        """Fetch all game items from database"""
        rows = db.fetch_all(
            "SELECT id, name, price, description, currency, game_platform, created_at FROM game_items"
        )
        if rows:
            return [
                GameItem(
                    row[0], row[1], row[2], row[3] or "", row[4], row[5],
                    row[6].isoformat() if row[6] else None
                ) for row in rows
            ]
        return []

    @staticmethod
    def fetch_by_id(item_id: int) -> 'GameItem':
        """Fetch specific game item by ID"""
        row = db.fetch_one(
            "SELECT id, name, price, description, currency, game_platform, created_at FROM game_items WHERE id = %s",
            (item_id,)
        )
        if row:
            return GameItem(
                row[0], row[1], row[2], row[3] or "", row[4], row[5],
                row[6].isoformat() if row[6] else None
            )
        return None

    @staticmethod
    def get_popular_items(limit: int = 10) -> List['GameItem']:
        """Get popular items based on transaction count"""
        rows = db.fetch_all('''
            SELECT g.id, g.name, g.price, g.description, g.currency, g.game_platform, g.created_at,
                   COUNT(t.id) as transaction_count
            FROM game_items g
            LEFT JOIN transactions t ON g.id = t.item_id
            GROUP BY g.id
            ORDER BY transaction_count DESC, g.created_at DESC
            LIMIT %s
        ''', (limit,))
        
        if rows:
            return [
                GameItem(
                    row[0], row[1], row[2], row[3] or "", row[4], row[5],
                    row[6].isoformat() if row[6] else None
                ) for row in rows
            ]
        return []

class ProductService:
    """Service class for product-related operations"""
    
    @staticmethod
    def get_all_items() -> List[Dict[str, Any]]:
        """Get all game items as dictionaries"""
        items = GameItem.fetch_all()
        return [item.to_dict() for item in items]
    
    @staticmethod
    def get_item_by_id(item_id: int) -> Dict[str, Any]:
        """Get specific game item by ID"""
        item = GameItem.fetch_by_id(item_id)
        return item.to_dict() if item else None
    
    @staticmethod
    def get_items_by_platform(platform: str) -> List[Dict[str, Any]]:
        """Get items filtered by game platform"""
        rows = db.fetch_all(
            "SELECT id, name, price, description, currency, game_platform, created_at FROM game_items WHERE game_platform LIKE %s",
            (f"%{platform}%",)
        )
        if rows:
            return [
                GameItem(
                    row[0], row[1], row[2], row[3] or "", row[4], row[5],
                    row[6].isoformat() if row[6] else None
                ).to_dict() for row in rows
            ]
        return []
    
    @staticmethod
    def get_popular_items(limit: int = 10) -> List[Dict[str, Any]]:
        """Get popular items for recommendations"""
        items = GameItem.get_popular_items(limit)
        return [item.to_dict() for item in items]