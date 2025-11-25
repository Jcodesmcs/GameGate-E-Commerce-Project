from database import db
from models import GameItem
import json

class ItemService:
    @staticmethod
    def get_all_items() -> dict:
        """Get all available game currency items with price options AND IMAGES"""
        rows = db.fetch_all(
            "SELECT id, name, description, price, currency, game_platform, price_options, image_data, currency_icon, created_at FROM game_items"
        )
        
        if rows is not None:
            items = []
            for row in rows:
                # Parse price_options from JSON string (LONGTEXT)
                price_options = []
                if row[6]:  # price_options column (LONGTEXT)
                    try:
                        price_options = json.loads(row[6])
                        print(f"✅ Backend - Parsed price_options for {row[1]}: {price_options}")
                    except json.JSONDecodeError as e:
                        print(f"❌ Backend - JSON decode error for {row[1]}: {e}")
                        print(f"   Raw data: {row[6]}")
                        price_options = []
                else:
                    print(f"⚠️ Backend - No price_options found for {row[1]}")
                
                item_data = {
                    "id": row[0],
                    "name": row[1],
                    "description": row[2],
                    "price": float(row[3]),
                    "currency": row[4],
                    "game_platform": row[5],
                    "priceOptions": price_options,
                    "image": row[7],  # ✅ ADD IMAGE DATA
                    "currency_icon": row[8],  # ✅ ADD CURRENCY ICON
                    "created_at": row[9].isoformat() if row[9] else None
                }
                
                print(f"📦 Backend - Sending item: {row[1]}")
                print(f"   - Has image: {'image' in item_data and bool(item_data['image'])}")
                print(f"   - Has currency_icon: {'currency_icon' in item_data and bool(item_data['currency_icon'])}")
                print(f"   - Has priceOptions: {'priceOptions' in item_data}")
                print(f"   - priceOptions length: {len(item_data.get('priceOptions', []))}")
                
                items.append(item_data)
            
            print(f"🎯 Backend - Total items to send: {len(items)}")
            return {
                "success": True,
                "items": items,
                "count": len(items)
            }
        else:
            return {"success": False, "error": "Failed to fetch items"}

    @staticmethod
    def get_item_by_id(item_id: int) -> dict:
        """Get specific game item by ID"""
        row = db.fetch_one(
            "SELECT id, name, description, price, currency, game_platform, created_at FROM game_items WHERE id = %s",
            (item_id,)
        )
            
        if row:
            item = GameItem(
                row[0], row[1], row[2], row[3], row[4], row[5],
                row[6].isoformat() if row[6] else None
            )
            return {"success": True, "item": item.to_dict()}
        else:
            return {"success": False, "error": "Item not found"}

    @staticmethod
    def search_items(keyword: str) -> dict:
        """Search items by name, description, or platform"""
        rows = db.fetch_all(
            "SELECT id, name, description, price, currency, game_platform, created_at FROM game_items WHERE name LIKE %s OR description LIKE %s OR game_platform LIKE %s",
            (f"%{keyword}%", f"%{keyword}%", f"%{keyword}%")
        )
        
        if rows is not None:
            items = []
            for row in rows:
                items.append(GameItem(
                    row[0], row[1], row[2], row[3], row[4], row[5],
                    row[6].isoformat() if row[6] else None
                ).to_dict())
            
            return {
                "success": True,
                "items": items,
                "count": len(items)
            }
        else:
            return {"success": False, "error": "Search failed"}

    @staticmethod
    def get_items_by_platform(platform: str) -> dict:
        """Get items filtered by game platform"""
        rows = db.fetch_all(
            "SELECT id, name, description, price, currency, game_platform, created_at FROM game_items WHERE game_platform LIKE %s",
            (f"%{platform}%",)
        )
        
        if rows is not None:
            items = []
            for row in rows:
                items.append(GameItem(
                    row[0], row[1], row[2], row[3], row[4], row[5],
                    row[6].isoformat() if row[6] else None
                ).to_dict())
            
            return {
                "success": True,
                "items": items,
                "count": len(items)
            }
        else:
            return {"success": False, "error": "Failed to fetch items by platform"}
        
    @staticmethod
    def add_game_item(name: str, description: str, price: float, currency: str = "PHP", 
                    game_platform: str = None, price_options: list = None, 
                    image_data: str = None, currency_icon: str = None) -> dict:
        """Admin function to add new game currency with price options and images"""
        if not name or price < 0:
            return {"success": False, "error": "Invalid item data"}
        
        import json
        
        # Convert price_options to JSON string for storage
        price_options_json = json.dumps(price_options) if price_options else '[]'
        
        print(f"💾 DATABASE - SAVING:")
        print(f"   Name: {name}")
        print(f"   Price: {price}")
        print(f"   Price Options: {price_options}")
        print(f"   Has Image: {bool(image_data)}")
        print(f"   Has Currency Icon: {bool(currency_icon)}")
        print(f"   Image length: {len(image_data) if image_data else 0}")
        print(f"   Currency icon length: {len(currency_icon) if currency_icon else 0}")
        
        # Execute the SQL query WITH IMAGE FIELDS
        success = db.execute(
            "INSERT INTO game_items (name, description, price, currency, game_platform, price_options, image_data, currency_icon) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (name, description, price, currency, game_platform, price_options_json, image_data, currency_icon)
        )
        
        if success:
            item_id = db.get_last_insert_id()
            print(f"✅ DATABASE - Item saved successfully with ID: {item_id}")
            return {
                "success": True,
                "message": "Item added successfully",
                "item_id": item_id
            }
        else:
            print("❌ DATABASE - Failed to save item")
            return {"success": False, "error": "Failed to add item"}