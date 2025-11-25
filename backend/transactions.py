from database import db
from items import ItemService

class TransactionService:
    @staticmethod
    def purchase_item(user_id: int, item_id: int, quantity: int = 1, final_price: float = None) -> dict:
        """Handle purchase of game currency with custom price support"""
        # Get item details
        item_result = ItemService.get_item_by_id(item_id)
        if not item_result["success"]:
            return {"success": False, "error": "Item not found"}
        
        item_data = item_result["item"]
        
        # Use provided final_price or calculate from item price
        if final_price is not None:
            actual_price = final_price
        else:
            actual_price = item_data['price'] * quantity
        
        # Create transaction
        success = db.execute(
            "INSERT INTO transactions (user_id, item_id, status, final_price, quantity) VALUES (%s, %s, %s, %s, %s)",
            (user_id, item_id, "completed", actual_price, quantity)
        )
        
        if success:
            transaction_id = db.get_last_insert_id()
            return {
                "success": True,
                "message": "Purchase completed successfully",
                "transaction": {
                    "id": transaction_id,
                    "user_id": user_id,
                    "item_id": item_id,
                    "status": "completed",
                    "final_price": actual_price,
                    "quantity": quantity,
                    "item_name": item_data['name'],
                    "currency": item_data['currency']
                }
            }
        else:
            return {"success": False, "error": "Transaction failed"}

    @staticmethod
    def get_all_transactions() -> dict:
        """Get all transactions for admin view - COMPLETE VERSION"""
        print("🔍 ADMIN: Fetching all transactions...")
        
        rows = db.fetch_all('''
            SELECT 
                t.id, 
                t.user_id, 
                t.item_id, 
                t.status, 
                t.final_price, 
                t.quantity, 
                t.created_at,
                g.name as item_name,
                g.currency,
                g.game_platform,
                u.username as user_username,
                u.email as user_email
            FROM transactions t
            LEFT JOIN game_items g ON t.item_id = g.id
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        ''')
        
        print(f"🔍 ADMIN: Found {len(rows) if rows else 0} transactions total")
        
        if rows is not None:
            transactions = []
            for row in rows:
                transaction_data = {
                    "id": row[0],
                    "user_id": row[1],
                    "item_id": row[2],
                    "status": row[3],
                    "final_price": float(row[4]),
                    "quantity": row[5],
                    "created_at": row[6].isoformat() if row[6] else None,
                    "item_name": row[7] or "Unknown Game",
                    "currency": row[8] or "PHP",
                    "game_platform": row[9] or "General",
                    "user_username": row[10] or "Unknown User",
                    "user_email": row[11] or "No Email"
                }
                transactions.append(transaction_data)
            
            print(f"✅ ADMIN: Returning {len(transactions)} transactions")
            return {
                "success": True,
                "transactions": transactions,
                "count": len(transactions)
            }
        else:
            print("❌ ADMIN: Database query failed")
            return {"success": False, "error": "Failed to fetch transactions"}
        
    @staticmethod
    def get_user_transactions(user_id: int) -> dict:
        """Get all transactions for a user - UPDATED FOR DEBUG"""
        print(f"🔍 Fetching transactions for user {user_id}")
        
        rows = db.fetch_all('''
            SELECT t.id, t.user_id, t.item_id, t.status, t.final_price, t.quantity, t.created_at, 
                g.name as item_name, g.currency, g.game_platform
            FROM transactions t
            JOIN game_items g ON t.item_id = g.id
            WHERE t.user_id = %s
            ORDER BY t.created_at DESC
        ''', (user_id,))
        
        print(f"📊 Database returned {len(rows) if rows else 0} rows")
        
        if rows is not None:
            transactions = []
            for row in rows:
                transaction_data = {
                    "id": row[0],
                    "user_id": row[1],
                    "item_id": row[2],
                    "status": row[3],
                    "final_price": float(row[4]),
                    "quantity": row[5],
                    "created_at": row[6].isoformat() if row[6] else None,
                    "item_name": row[7],
                    "currency": row[8],
                    "game_platform": row[9]
                }
                print(f"📦 Transaction {row[0]}: {transaction_data}")
                transactions.append(transaction_data)
            
            print(f"✅ Returning {len(transactions)} transactions")
            return {
                "success": True,
                "transactions": transactions,
                "count": len(transactions)
            }
        else:
            print("❌ Database query failed")
            return {"success": False, "error": "Failed to fetch transactions"}