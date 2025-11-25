# news.py
from database import db
from typing import Dict, List, Optional

class NewsService:
    @staticmethod
    def get_all_news() -> Dict:
        """Get all active news items"""
        try:
            rows = db.fetch_all(
                "SELECT id, title, description, date, icon, is_active, created_at FROM news WHERE is_active = TRUE ORDER BY date DESC, created_at DESC"
            )
            
            if rows is not None:
                news_items = []
                for row in rows:
                    news_items.append({
                        "id": row[0],
                        "title": row[1],
                        "description": row[2],
                        "date": row[3].isoformat() if row[3] else None,
                        "icon": row[4],
                        "is_active": bool(row[5]),
                        "created_at": row[6].isoformat() if row[6] else None
                    })
                
                return {
                    "success": True,
                    "news": news_items,
                    "count": len(news_items)
                }
            else:
                return {"success": False, "error": "Failed to fetch news"}
        except Exception as e:
            print(f"❌ Error in get_all_news: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def add_news(title: str, description: str, date: str, icon: str) -> Dict:
        """Add new news item"""
        try:
            if not title or not description or not date or not icon:
                return {"success": False, "error": "All fields are required"}
            
            print(f"📰 Adding news: {title}")
            
            success = db.execute(
                "INSERT INTO news (title, description, date, icon) VALUES (%s, %s, %s, %s)",
                (title, description, date, icon)
            )
            
            if success:
                news_id = db.get_last_insert_id()
                print(f"✅ News #{news_id} added successfully")
                return {
                    "success": True, 
                    "message": "News added successfully", 
                    "news_id": news_id
                }
            else:
                print("❌ Failed to add news")
                return {"success": False, "error": "Failed to add news"}
                
        except Exception as e:
            print(f"❌ Error in add_news: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def update_news(news_id: int, title: str, description: str, date: str, icon: str) -> Dict:
        """Update existing news item"""
        try:
            if not title or not description or not date or not icon:
                return {"success": False, "error": "All fields are required"}
            
            success = db.execute(
                "UPDATE news SET title = %s, description = %s, date = %s, icon = %s WHERE id = %s",
                (title, description, date, icon, news_id)
            )
            
            if success:
                print(f"✅ News #{news_id} updated successfully")
                return {"success": True, "message": "News updated successfully"}
            else:
                return {"success": False, "error": "Failed to update news"}
                
        except Exception as e:
            print(f"❌ Error in update_news: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def delete_news(news_id: int) -> Dict:
        """Delete news item (soft delete by setting is_active to FALSE)"""
        try:
            success = db.execute(
                "UPDATE news SET is_active = FALSE WHERE id = %s",
                (news_id,)
            )
            
            if success:
                print(f"✅ News #{news_id} deleted successfully")
                return {"success": True, "message": "News deleted successfully"}
            else:
                return {"success": False, "error": "Failed to delete news"}
        except Exception as e:
            print(f"❌ Error in delete_news: {e}")
            return {"success": False, "error": str(e)}