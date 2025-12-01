# 🎮 GameGate - E-Commerce Management System

![Python](https://img.shields.io/badge/python-3.8%2B-blue)
![Flask](https://img.shields.io/badge/flask-2.3.3-green)
![MySQL](https://img.shields.io/badge/mysql-5.7%2B-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

A full-stack e-commerce platform for digital game currency sales, built with Python Flask, MySQL, and modern web technologies.

## 🚀 Features

### 🛍️ Customer Features
- **User Registration & Authentication** - Secure account management
- **Advanced Product Search** - Trie-based autocomplete and hybrid search
- **Multi-step Purchase Flow** - Streamlined checkout process
- **Category Browsing** - Organized by game platforms (MOBA, RPG, FPS, etc.)
- **Transaction History** - Complete purchase tracking

### ⚙️ Admin Features
- **Product Management** - Full CRUD operations with image upload
- **User Management** - Customer oversight and role-based access
- **Transaction Monitoring** - Comprehensive sales analytics
- **Content Management** - Promotional banners and news updates

### 🏗️ Technical Highlights
- **Trie Data Structure** - O(k) search time for product autocomplete
- **RESTful API** - Clean separation between frontend and backend
- **Responsive Design** - Mobile-friendly user interface
- **Secure Authentication** - Role-based access control

## 🛠️ Tech Stack

**Backend:**
- Python Flask
- MySQL Database
- RESTful API Architecture

**Frontend:**
- HTML5, CSS3, JavaScript
- Responsive Design
- Modern UI Components

**Data Structures:**
- Trie for efficient search
- Queues for order processing
- Hash Maps for session management

## 📦 Installation

### Prerequisites
- Python 3.8+
- MySQL 5.7+
- Modern web browser

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/GameGate-Ecommerce.git
cd GameGate-Ecommerce
cd backend
pip install -r requirements.txt
```

2. **Backend Setup**
```bash
# Set environment variables
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_NAME=ecurrency

# Start server
python api_server.py
```

3. **Frondend Setup**
```bash
cd ../frontend/main
# Serve using any static server
python -m http.server 8000
```
4. **Access the Application**

Main Store: http://localhost:8000
Admin Panel: http://localhost:8000/admin/admin.html
API Server: http://localhost:5000

🗂️ **Project Structure**
```bash
GameGate-Ecommerce/
├── backend/                 # Python Flask API
│   ├── api_server.py       # Main application entry point
│   ├── database.py         # Database connection & management
│   ├── auth.py             # Authentication services
│   ├── items.py            # Product management
│   ├── transactions.py     # Order processing
│   ├── search_system.py    # Trie-based search implementation
│   └── background/         # Background services
├── frontend/               # Web interface
│   ├── main/               # Customer storefront
│   ├── admin/              # Administration panel
│   └── profile/            # User profile pages
└── README.md
```

🔍 **Search Algorithm**
Our advanced search system uses a Trie data structure for real-time autocomplete:
```bash
class TrieNode:
    def __init__(self):
        self.children = {}      # O(1) character lookup
        self.is_end = False     # Word completion marker
        self.item_ids = []      # Associated product IDs

# Performance: O(k) search time vs O(n) for linear search
```

📊 **API Endpoints**

Method	Endpoint	                  Description
POST	/api/auth/login	            User authentication
POST	/api/auth/signup	          User registration
GET	  /api/items	                Get all products
GET	  /api/search/autocomplete	  Trie-based search suggestions
POST	/api/transactions/purchase	Process orders

🎯 **Usage Examples**

**Customer Purchase Flow**
1. Register/Login to your account
2. Browse products or use search with autocomplete
3. Select product and choose package
4. Complete multi-step checkout process
5. View transaction history in profile

**Admin Management**
1. Login with admin credentials
2. Manage products with image upload
3. Monitor all customer transactions
4. Update promotional content

🚨 **Default Accounts**
**Admin Accounts**
Username: admin | Password: admin123
Username: superadmin | Password: superadmin123

**Test Customer Account**
Register through the signup form on the main page.

🔧 Troubleshooting
Common Issues
1. Database Connection Failed
- Verify MySQL is running
- Check environment variables
- Ensure database exists

2. CORS Errors
- Backend server must be running on port 5000
- Frontend should be on different port (8000)

3. Images Not Loading
Check browser console for errors
Verify image upload process

🤝 **Contributing**
1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

🐛 **Bug Reports**
If you discover any bugs, please create an issue with:
- Detailed description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

💡 Future Enhancements
- Mobile application
- Payment gateway integration
- AI-powered recommendations
- Multi-language support
- Advanced analytics dashboard

👥 Team
JMCS - Backend Development
ALMM - Frontend Development
JLTG - Database Design
JMCS - Project Management

🙏 Acknowledgments
- University faculty for guidance and support
- Open-source libraries and frameworks used
- Inspiration from modern e-commerce platforms
