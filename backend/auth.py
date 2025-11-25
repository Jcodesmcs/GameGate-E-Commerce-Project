from database import db
import hashlib
import secrets

class AuthService:
    @staticmethod
    def signup(username: str, email: str, password: str, role: str = "user") -> dict:
        """Handle user registration - PREVENT ADMIN SIGNUP"""
        # Validation
        if not username or not email or not password:
            return {"success": False, "error": "All fields are required"}
        
        if len(password) < 6:
            return {"success": False, "error": "Password must be at least 6 characters"}
        
        if len(username) < 3:
            return {"success": False, "error": "Username must be at least 3 characters"}

        # PREVENT users from signing up as admin
        if role != "user":
            return {"success": False, "error": "Invalid role"}

        # Check if user already exists
        existing_user = db.fetch_one(
            "SELECT id FROM users WHERE username = %s OR email = %s", 
            (username, email)
        )
        if existing_user:
            return {"success": False, "error": "Username or email already exists"}

        # Use the SAME password hashing as in database.py
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        final_password_hash = f"{salt}${password_hash}"
        
        success = db.execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
            (username, email, final_password_hash, "user")  # Force 'user' role
        )
        
        if success:
            user_id = db.get_last_insert_id()
            return {
                "success": True,
                "message": "Registration successful!",
                "user": {
                    "id": user_id,
                    "username": username,
                    "email": email,
                    "role": "user"  # Always user role
                }
            }
        else:
            return {"success": False, "error": "Registration failed"}

    @staticmethod
    def login(username_or_email: str, password: str) -> dict:
        """Handle user login - FIXED to match database.py hashing"""
        if not username_or_email or not password:
            return {"success": False, "error": "Username/email and password are required"}

        # Get user from database
        user_data = db.fetch_one(
            "SELECT id, username, email, password_hash, role FROM users WHERE username = %s OR email = %s",
            (username_or_email, username_or_email)
        )
        
        if user_data:
            user_id, username, email, stored_password_hash, role = user_data
            
            # Verify password using the same method as database.py
            if '$' in stored_password_hash:
                salt, stored_hash = stored_password_hash.split('$', 1)
                input_hash = hashlib.sha256((password + salt).encode()).hexdigest()
                
                if input_hash == stored_hash:
                    return {
                        "success": True,
                        "message": "Login successful!",
                        "user": {
                            "id": user_id,
                            "username": username,
                            "email": email,
                            "role": role
                        }
                    }
        
        return {"success": False, "error": "Invalid credentials"}

    @staticmethod
    def get_user_profile(user_id: int) -> dict:
        """Get user profile by ID"""
        user_data = db.fetch_one(
            "SELECT id, username, email, role FROM users WHERE id = %s",
            (user_id,)
        )
        
        if user_data:
            user_id, username, email, role = user_data
            return {
                "success": True,
                "user": {
                    "id": user_id,
                    "username": username,
                    "email": email,
                    "role": role
                }
            }
        else:
            return {"success": False, "error": "User not found"}