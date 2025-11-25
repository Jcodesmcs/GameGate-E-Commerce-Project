import mysql.connector
from mysql.connector import Error
import os
from typing import Optional, List, Tuple

class Database:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self.db_name = os.getenv('DB_NAME', 'e-currency')
        self._init_database()

    def _init_database(self):
        """Initialize database connection and tables"""
        try:
            conn = self._connect(use_database=False)
            if conn:
                cursor = conn.cursor()
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{self.db_name}`")
                cursor.execute(f"USE `{self.db_name}`")
                
                # Create tables
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        username VARCHAR(80) NOT NULL UNIQUE,
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password_hash VARCHAR(255) NOT NULL,
                        role VARCHAR(50) NOT NULL DEFAULT 'user',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                
                # In database.py - Update the game_items table creation
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS game_items (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(200) NOT NULL,
                        description TEXT,
                        price DECIMAL(12,2) NOT NULL,
                        currency VARCHAR(10) DEFAULT 'PHP',
                        game_platform VARCHAR(100),
                        image_data LONGTEXT,  -- ✅ ADD THIS FOR GAME IMAGE
                        currency_icon LONGTEXT,  -- ✅ ADD THIS FOR CURRENCY ICON
                        price_options LONGTEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                # ✅ ADD THE NEWS TABLE RIGHT HERE:
                cursor.execute('''
                CREATE TABLE IF NOT EXISTS news (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    date DATE NOT NULL,
                    icon VARCHAR(10) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')




                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS transactions (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        user_id BIGINT UNSIGNED NOT NULL,
                        item_id BIGINT UNSIGNED NOT NULL,
                        status VARCHAR(20) NOT NULL DEFAULT 'pending',
                        final_price DECIMAL(12,2) NOT NULL,
                        quantity INT NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id),
                        FOREIGN KEY (item_id) REFERENCES game_items(id)
                    )
                ''')

                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS promos (
                        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        image_data LONGTEXT NOT NULL,
                        title VARCHAR(200),
                        description TEXT,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')

                # Create default admin accounts
                self._create_default_admin_accounts(cursor)
                
                conn.commit()
                cursor.close()
                conn.close()
                print("✅ Database initialized successfully!")
                
        except Error as e:
            print(f"❌ Database initialization failed: {e}")

    def _connect(self, use_database=True):
        try:
            if use_database:
                return mysql.connector.connect(
                    host=self.host,
                    user=self.user,
                    password=self.password,
                    database=self.db_name
                )
            else:
                return mysql.connector.connect(
                    host=self.host,
                    user=self.user,
                    password=self.password
                )
        except Error as e:
            print(f"❌ Database connection failed: {e}")
            return None

    def execute(self, query: str, params: Tuple = ()) -> bool:
        conn = self._connect()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute(query, params)
                conn.commit()
                cursor.close()
                conn.close()
                return True
            except Error as e:
                print(f"❌ Query execution failed: {e}")
                return False
        return False

    def fetch_one(self, query: str, params: Tuple = ()) -> Optional[Tuple]:
        conn = self._connect()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute(query, params)
                result = cursor.fetchone()
                cursor.close()
                conn.close()
                return result
            except Error as e:
                print(f"❌ Fetch one failed: {e}")
                return None
        return None

    def fetch_all(self, query: str, params: Tuple = ()) -> Optional[List[Tuple]]:
        conn = self._connect()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute(query, params)
                results = cursor.fetchall()
                cursor.close()
                conn.close()
                return results
            except Error as e:
                print(f"❌ Fetch all failed: {e}")
                return None
        return None

    def get_last_insert_id(self) -> Optional[int]:
        result = self.fetch_one("SELECT LAST_INSERT_ID()")
        return result[0] if result else None
    
    def _create_default_admin_accounts(self, cursor):
        """Create default admin accounts without importing User model"""
        import hashlib
        import secrets
        
        admin_accounts = [
            {
                'username': 'admin',
                'email': 'admin@gamegate.com', 
                'password': 'admin123',  
                'role': 'admin'
            },
            {
                'username': 'superadmin',
                'email': 'superadmin@gamegate.com',
                'password': 'superadmin123',  
                'role': 'admin'
            }
        ]
        
        for admin in admin_accounts:
            # Check if admin already exists
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                          (admin['username'], admin['email']))
            existing_admin = cursor.fetchone()
            
            if not existing_admin:
                # Create admin account with simple password hashing
                # This avoids the circular import with User model
                salt = secrets.token_hex(16)
                password_hash = hashlib.sha256((admin['password'] + salt).encode()).hexdigest()
                
                cursor.execute(
                    "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
                    (admin['username'], admin['email'], f"{salt}${password_hash}", admin['role'])
                )
                print(f"✅ Created admin account: {admin['username']}")

# Global database instance
db = Database()