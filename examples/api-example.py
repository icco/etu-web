#!/usr/bin/env python3
"""
Etu Server API Example
Demonstrates how to interact with the Etu Server REST API using Python.
"""

import requests
import json
from typing import Optional, Dict, List, Any

# Configuration
API_KEY = "etu_your_api_key_here"
BASE_URL = "http://localhost:3000/api/v1"

class EtuClient:
    """Simple client for the Etu Server API."""
    
    def __init__(self, api_key: str, base_url: str = BASE_URL):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": api_key,
            "Content-Type": "application/json"
        }
    
    def list_notes(
        self,
        search: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """List notes with optional filtering."""
        params = {"limit": limit, "offset": offset}
        if search:
            params["search"] = search
        if tags:
            params["tags"] = ",".join(tags)
        
        response = requests.get(
            f"{self.base_url}/notes",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def create_note(self, content: str, tags: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a new note."""
        data = {"content": content}
        if tags:
            data["tags"] = tags
        
        response = requests.post(
            f"{self.base_url}/notes",
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def get_note(self, note_id: str) -> Dict[str, Any]:
        """Get a specific note by ID."""
        response = requests.get(
            f"{self.base_url}/notes/{note_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def update_note(
        self,
        note_id: str,
        content: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Update a note."""
        data = {}
        if content is not None:
            data["content"] = content
        if tags is not None:
            data["tags"] = tags
        
        response = requests.put(
            f"{self.base_url}/notes/{note_id}",
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def delete_note(self, note_id: str) -> Dict[str, Any]:
        """Delete a note."""
        response = requests.delete(
            f"{self.base_url}/notes/{note_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def list_tags(self) -> Dict[str, Any]:
        """List all tags."""
        response = requests.get(
            f"{self.base_url}/tags",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


def main():
    """Example usage of the Etu API client."""
    print("Etu Server API Example")
    print("=" * 50)
    
    # Initialize client
    client = EtuClient(API_KEY)
    
    try:
        # Example 1: Create a note
        print("\n1. Creating a new note...")
        note = client.create_note(
            content="# Meeting Notes\n\n- Discussed project timeline\n- Reviewed requirements",
            tags=["work", "meeting"]
        )
        print(f"   Created note: {note['id']}")
        note_id = note['id']
        
        # Example 2: Get the note
        print("\n2. Retrieving the note...")
        retrieved = client.get_note(note_id)
        print(f"   Content: {retrieved['content'][:50]}...")
        
        # Example 3: Update the note
        print("\n3. Updating the note...")
        updated = client.update_note(
            note_id,
            content="# Meeting Notes (Updated)\n\n- Discussed project timeline\n- Reviewed requirements\n- Assigned action items"
        )
        print(f"   Updated at: {updated['updatedAt']}")
        
        # Example 4: List all notes
        print("\n4. Listing all notes...")
        notes = client.list_notes(limit=5)
        print(f"   Total notes: {notes['total']}")
        print(f"   Fetched: {len(notes['notes'])} notes")
        
        # Example 5: Search notes
        print("\n5. Searching for notes...")
        results = client.list_notes(search="meeting")
        print(f"   Found {len(results['notes'])} notes matching 'meeting'")
        
        # Example 6: Filter by tags
        print("\n6. Filtering notes by tags...")
        tagged = client.list_notes(tags=["work"])
        print(f"   Found {len(tagged['notes'])} notes with 'work' tag")
        
        # Example 7: List all tags
        print("\n7. Listing all tags...")
        tags = client.list_tags()
        print(f"   Total tags: {len(tags['tags'])}")
        for tag in tags['tags'][:5]:
            print(f"   - {tag['name']}: {tag['count']} notes")
        
        # Example 8: Delete the note
        print(f"\n8. Deleting note {note_id}...")
        result = client.delete_note(note_id)
        print(f"   Success: {result['success']}")
        
        print("\n" + "=" * 50)
        print("All examples completed successfully!")
        
    except requests.exceptions.HTTPError as e:
        print(f"\nError: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"\nUnexpected error: {e}")


if __name__ == "__main__":
    main()
