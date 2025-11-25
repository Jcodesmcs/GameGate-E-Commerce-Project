from database import db
import json

class PromoService:
    @staticmethod
    def get_all_promos() -> dict:
        """Get all active promo images"""
        try:
            rows = db.fetch_all(
                "SELECT id, image_data, title, description, is_active, created_at FROM promos WHERE is_active = TRUE ORDER BY created_at DESC"
            )
            
            if rows is not None:
                promos = []
                for row in rows:
                    promos.append({
                        "id": row[0],
                        "image": row[1],  # Base64 image data
                        "title": row[2],
                        "description": row[3],
                        "is_active": bool(row[4]),
                        "created_at": row[5].isoformat() if row[5] else None
                    })
                
                return {
                    "success": True,
                    "promos": promos,
                    "count": len(promos)
                }
            else:
                return {"success": False, "error": "Failed to fetch promos"}
        except Exception as e:
            print(f"❌ Error in get_all_promos: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def add_promo(image_base64: str, title: str = None, description: str = None) -> dict:
        """Add new promo image - CLEAN VERSION"""
        try:
            if not image_base64:
                return {"success": False, "error": "Image data is required"}
            
            print(f"📸 Adding promo image...")  # Simple message only
            
            success = db.execute(
                "INSERT INTO promos (image_data, title, description) VALUES (%s, %s, %s)",
                (image_base64, title, description)
            )
            
            if success:
                promo_id = db.get_last_insert_id()
                print(f"✅ Promo #{promo_id} added")
                return {"success": True, "message": "Promo added successfully", "promo_id": promo_id}
            else:
                print("❌ Failed to add promo")
                return {"success": False, "error": "Failed to add promo"}
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_promo(promo_id: int) -> dict:
        """Delete promo by ID"""
        try:
            success = db.execute("DELETE FROM promos WHERE id = %s", (promo_id,))
            
            if success:
                return {"success": True, "message": "Promo deleted successfully"}
            else:
                return {"success": False, "error": "Failed to delete promo"}
        except Exception as e:
            print(f"❌ Error in delete_promo: {e}")
            return {"success": False, "error": str(e)}