from typing import List, Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import db
from background.product_service import GameItem

class TrieNode:
    """Node for Trie data structure"""
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.item_ids = []

class SearchTrie:
    """Trie data structure for efficient autocomplete"""
    def __init__(self):
        self.root = TrieNode()
        self._build_trie()

    def _build_trie(self):
        """Build trie from all game items in database"""
        items = GameItem.fetch_all()
        for item in items:
            self.insert(item.name.lower(), item.id)

    def insert(self, word: str, item_id: int):
        """Insert a word into the trie"""
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
            if item_id not in node.item_ids:
                node.item_ids.append(item_id)
        node.is_end = True

    def search_prefix(self, prefix: str) -> List[int]:
        """Find all item IDs for words starting with prefix"""
        node = self.root
        for char in prefix.lower():
            if char not in node.children:
                return []
            node = node.children[char]
        
        # Collect all product IDs from this node and its children
        item_ids = set()
        self._collect_item_ids(node, item_ids)
        return list(item_ids)

    def _collect_item_ids(self, node: TrieNode, item_ids: set):
        """Recursively collect all item IDs from node and its children"""
        item_ids.update(node.item_ids)
        for child in node.children.values():
            self._collect_item_ids(child, item_ids)

class SearchSystem:
    """Search system with both SQL and Trie-based search"""
    def __init__(self):
        self.trie = SearchTrie()

    def sql_search(self, keyword: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search using SQL LIKE for comprehensive results"""
        rows = db.fetch_all('''
            SELECT id, name, price, description, currency, game_platform, created_at 
            FROM game_items 
            WHERE name LIKE %s OR description LIKE %s OR game_platform LIKE %s
            LIMIT %s
        ''', (f"%{keyword}%", f"%{keyword}%", f"%{keyword}%", limit))
        
        if rows:
            return [
                GameItem(
                    row[0], row[1], row[2], row[3] or "", row[4], row[5],
                    row[6].isoformat() if row[6] else None
                ).to_dict() for row in rows
            ]
        return []

    def autocomplete(self, prefix: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get autocomplete suggestions using trie (fast)"""
        if len(prefix) < 2:
            return []
        
        item_ids = self.trie.search_prefix(prefix)[:limit]
        results = []
        
        for item_id in item_ids:
            item = GameItem.fetch_by_id(item_id)
            if item:
                results.append(item.to_dict())
        
        return results

    def hybrid_search(self, keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Combine trie and SQL search for best results"""
        # Use trie for quick prefix matching
        if len(keyword) >= 2:
            trie_results = self.autocomplete(keyword, limit // 2)
        else:
            trie_results = []
        
        # Use SQL for comprehensive search
        sql_results = self.sql_search(keyword, limit - len(trie_results))
        
        # Combine and remove duplicates
        combined = {}
        for item in trie_results + sql_results:
            if item['id'] not in combined:
                combined[item['id']] = item
        
        return list(combined.values())[:limit]

    def search_by_platform(self, platform: str, keyword: str = "") -> List[Dict[str, Any]]:
        """Search within specific platform"""
        if keyword:
            rows = db.fetch_all('''
                SELECT id, name, price, description, currency, game_platform, created_at 
                FROM game_items 
                WHERE game_platform LIKE %s AND (name LIKE %s OR description LIKE %s)
            ''', (f"%{platform}%", f"%{keyword}%", f"%{keyword}%"))
        else:
            rows = db.fetch_all('''
                SELECT id, name, price, description, currency, game_platform, created_at 
                FROM game_items 
                WHERE game_platform LIKE %s
            ''', (f"%{platform}%",))
        
        if rows:
            return [
                GameItem(
                    row[0], row[1], row[2], row[3] or "", row[4], row[5],
                    row[6].isoformat() if row[6] else None
                ).to_dict() for row in rows
            ]
        return []

# Global search system instance
search_system = SearchSystem()