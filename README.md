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
'''

2. **Backend Setup**
'''bash
# Set environment variables
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_NAME=ecurrency

# Start server
python api_server.py
'''

3. **Frondend Setup**
'''bash
cd ../frontend/main
# Serve using any static server
python -m http.server 8000
'''
