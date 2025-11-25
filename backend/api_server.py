from database import db
from flask import Flask, request, jsonify
from auth import AuthService
from items import ItemService
from transactions import TransactionService
from background.search_system import search_system
from flask_cors import CORS 
from promos import PromoService
from news import NewsService 

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Authentication Endpoints
@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"})
        
        result = AuthService.signup(
            data.get('username'),
            data.get('email'),
            data.get('password'),
            data.get('role', 'user')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"})
        
        result = AuthService.login(
            data.get('username_or_email'),
            data.get('password')
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/auth/profile/<int:user_id>', methods=['GET'])
def api_get_profile(user_id):
    try:
        result = AuthService.get_user_profile(user_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# Game Items Endpoints
@app.route('/api/items', methods=['GET'])
def api_get_items():
    try:
        result = ItemService.get_all_items()
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/items/<int:item_id>', methods=['GET'])
def api_get_item(item_id):
    try:
        result = ItemService.get_item_by_id(item_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/items/search', methods=['GET'])
def api_search_items():
    try:
        keyword = request.args.get('q', '')
        result = ItemService.search_items(keyword)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/items/platform/<platform>', methods=['GET'])
def api_items_by_platform(platform):
    try:
        result = ItemService.get_items_by_platform(platform)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# Transaction Endpoints
@app.route('/api/transactions/purchase', methods=['POST'])
def api_purchase():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"})
        
        result = TransactionService.purchase_item(
            data.get('user_id'),
            data.get('item_id'),
            data.get('quantity', 1),
            data.get('final_price')  # Add this parameter
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/transactions/user/<int:user_id>', methods=['GET'])
def api_user_transactions(user_id):
    try:
        result = TransactionService.get_user_transactions(user_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# Admin Endpoints
@app.route('/api/admin/items', methods=['POST'])
def api_add_item():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"})
        
        print("🎯 BACKEND - RECEIVED DATA:")
        print(f"All keys: {list(data.keys())}")
        print(f"Name: {data.get('name')}")
        print(f"Price: {data.get('price')}")
        print(f"Has image: {'image' in data}")
        print(f"Has currency_icon: {'currency_icon' in data}")
        
        # Check if price_options exists
        price_options = data.get('price_options')
        print(f"Price Options Received: {price_options}")
        print(f"Number of Price Options: {len(price_options) if price_options else 0}")
        
        # Get image data
        image_data = data.get('image')
        currency_icon = data.get('currency_icon')
        
        print(f"Image data length: {len(image_data) if image_data else 0}")
        print(f"Currency icon length: {len(currency_icon) if currency_icon else 0}")
        
        if not price_options:
            print("❌ CRITICAL: price_options is None or empty!")
        else:
            print("✅ Price options found in request")
        
        result = ItemService.add_game_item(
            data.get('name'),
            data.get('description'),
            data.get('price'),
            data.get('currency', 'PHP'),
            data.get('game_platform'),
            price_options,  # Pass it directly
            image_data,     # ✅ ADD IMAGE DATA
            currency_icon   # ✅ ADD CURRENCY ICON
        )
        return jsonify(result)
    except Exception as e:
        print(f"❌ Backend error: {e}")
        return jsonify({"success": False, "error": str(e)})
    
# Search Endpoints
@app.route('/api/search/autocomplete', methods=['GET'])
def api_autocomplete():
    try:
        prefix = request.args.get('prefix', '')
        limit = int(request.args.get('limit', 5))
        
        if len(prefix) < 2:
            return jsonify({"success": True, "suggestions": []})
        
        suggestions = search_system.autocomplete(prefix, limit)
        return jsonify({
            "success": True,
            "prefix": prefix,
            "suggestions": suggestions
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/search', methods=['GET'])
def api_search():
    try:
        keyword = request.args.get('q', '')
        limit = int(request.args.get('limit', 10))
        
        if not keyword:
            return jsonify({"success": False, "error": "Search keyword required"})
        
        results = search_system.hybrid_search(keyword, limit)
        return jsonify({
            "success": True,
            "keyword": keyword,
            "results": results,
            "count": len(results)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/search/platform', methods=['GET'])
def api_platform_search():
    try:
        platform = request.args.get('platform', '')
        keyword = request.args.get('q', '')
        
        if not platform:
            return jsonify({"success": False, "error": "Platform parameter required"})
        
        results = search_system.search_by_platform(platform, keyword)
        return jsonify({
            "success": True,
            "platform": platform,
            "keyword": keyword,
            "results": results,
            "count": len(results)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    
@app.route('/api/admin/items/<int:item_id>', methods=['DELETE'])
def api_delete_item(item_id):
    try:
        # First, check if there are any transactions for this item
        transaction_count = db.fetch_one("SELECT COUNT(*) FROM transactions WHERE item_id = %s", (item_id,))
        
        if transaction_count and transaction_count[0] > 0:
            db.execute("DELETE FROM transactions WHERE item_id = %s", (item_id,))

        # Now delete the item
        success = db.execute("DELETE FROM game_items WHERE id = %s", (item_id,))
        
        if success:
            return jsonify({"success": True, "message": "Item deleted successfully"})
        else:
            return jsonify({"success": False, "error": "Failed to delete item"})
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    
@app.route('/api/promos', methods=['GET'])
def api_get_promos():
    try:
        print("🔍 GET /api/promos endpoint called")
        result = PromoService.get_all_promos()
        print(f"✅ GET /api/promos result: {result}")
        return jsonify(result)
    except Exception as e:
        print(f"❌ GET /api/promos error: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/promos', methods=['POST'])
def api_add_promo():
    try:
        print("🔍 POST /api/promos endpoint called")
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"})
        
        print(f"📦 Received promo data with image: {'Yes' if data.get('image') else 'No'}")
        
        result = PromoService.add_promo(
            data.get('image'),
            data.get('title'),
            data.get('description')
        )
        return jsonify(result)
    except Exception as e:
        print(f"❌ POST /api/promos error: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/promos/<int:promo_id>', methods=['DELETE'])
def api_delete_promo(promo_id):
    try:
        print(f"🔍 DELETE /api/promos/{promo_id} endpoint called")
        result = PromoService.delete_promo(promo_id)
        return jsonify(result)
    except Exception as e:
        print(f"❌ DELETE /api/promos error: {e}")
        return jsonify({"success": False, "error": str(e)})

# News Endpoints
@app.route('/api/news', methods=['GET'])
def api_get_news():
    try:
        print("🔍 GET /api/news endpoint called")
        result = NewsService.get_all_news()
        print(f"✅ GET /api/news result: {result.get('count', 0)} items")
        return jsonify(result)
    except Exception as e:
        print(f"❌ GET /api/news error: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/news', methods=['POST'])
def api_add_news():
    try:
        print("🔍 POST /api/news endpoint called")
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"})
        
        print(f"📦 Received news data: {data.get('title')}")
        
        result = NewsService.add_news(
            data.get('title'),
            data.get('description'),
            data.get('date'),
            data.get('icon')
        )
        return jsonify(result)
    except Exception as e:
        print(f"❌ POST /api/news error: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/news/<int:news_id>', methods=['PUT'])
def api_update_news(news_id):
    try:
        print(f"🔍 PUT /api/news/{news_id} endpoint called")
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"})
        
        result = NewsService.update_news(
            news_id,
            data.get('title'),
            data.get('description'),
            data.get('date'),
            data.get('icon')
        )
        return jsonify(result)
    except Exception as e:
        print(f"❌ PUT /api/news error: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/news/<int:news_id>', methods=['DELETE'])
def api_delete_news(news_id):
    try:
        print(f"🔍 DELETE /api/news/{news_id} endpoint called")
        result = NewsService.delete_news(news_id)
        return jsonify(result)
    except Exception as e:
        print(f"❌ DELETE /api/news error: {e}")
        return jsonify({"success": False, "error": str(e)})
    
@app.route('/api/transactions/all', methods=['GET'])
def api_all_transactions():
    try:
        # Add admin authentication here if needed
        result = TransactionService.get_all_transactions()
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "E-Currency API is running"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
