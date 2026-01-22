#!/usr/bin/env node
/**
 * Etu Server API Example
 * Demonstrates how to interact with the Etu Server REST API using JavaScript/Node.js.
 */

// Configuration
const API_KEY = "etu_your_api_key_here";
const BASE_URL = "http://localhost:3000/api/v1";

class EtuClient {
  constructor(apiKey, baseUrl = BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    };
  }

  async listNotes({ search, tags, limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit, offset });
    if (search) params.append("search", search);
    if (tags) params.append("tags", tags.join(","));

    const response = await fetch(`${this.baseUrl}/notes?${params}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async createNote(content, tags = []) {
    const response = await fetch(`${this.baseUrl}/notes`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ content, tags }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async getNote(noteId) {
    const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async updateNote(noteId, { content, tags } = {}) {
    const data = {};
    if (content !== undefined) data.content = content;
    if (tags !== undefined) data.tags = tags;

    const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
      method: "PUT",
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async deleteNote(noteId) {
    const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
      method: "DELETE",
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async listTags() {
    const response = await fetch(`${this.baseUrl}/tags`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }
}

async function main() {
  console.log("Etu Server API Example");
  console.log("=".repeat(50));

  // Initialize client
  const client = new EtuClient(API_KEY);

  try {
    // Example 1: Create a note
    console.log("\n1. Creating a new note...");
    const note = await client.createNote(
      "# Daily Standup\n\n- Completed feature X\n- Working on feature Y\n- Blocked on issue Z",
      ["work", "standup"]
    );
    console.log(`   Created note: ${note.id}`);
    const noteId = note.id;

    // Example 2: Get the note
    console.log("\n2. Retrieving the note...");
    const retrieved = await client.getNote(noteId);
    console.log(`   Content: ${retrieved.content.substring(0, 50)}...`);
    console.log(`   Tags: ${retrieved.tags.join(", ")}`);

    // Example 3: Update the note
    console.log("\n3. Updating the note...");
    const updated = await client.updateNote(noteId, {
      content:
        "# Daily Standup (Updated)\n\n- Completed feature X ✅\n- Working on feature Y\n- Issue Z resolved",
    });
    console.log(`   Updated at: ${updated.updatedAt}`);

    // Example 4: List all notes
    console.log("\n4. Listing all notes...");
    const notes = await client.listNotes({ limit: 5 });
    console.log(`   Total notes: ${notes.total}`);
    console.log(`   Fetched: ${notes.notes.length} notes`);

    // Example 5: Search notes
    console.log("\n5. Searching for notes...");
    const results = await client.listNotes({ search: "standup" });
    console.log(`   Found ${results.notes.length} notes matching 'standup'`);

    // Example 6: Filter by tags
    console.log("\n6. Filtering notes by tags...");
    const tagged = await client.listNotes({ tags: ["work"] });
    console.log(`   Found ${tagged.notes.length} notes with 'work' tag`);

    // Example 7: List all tags
    console.log("\n7. Listing all tags...");
    const tags = await client.listTags();
    console.log(`   Total tags: ${tags.tags.length}`);
    tags.tags.slice(0, 5).forEach((tag) => {
      console.log(`   - ${tag.name}: ${tag.count} notes`);
    });

    // Example 8: Delete the note
    console.log(`\n8. Deleting note ${noteId}...`);
    const result = await client.deleteNote(noteId);
    console.log(`   Success: ${result.success}`);

    console.log("\n" + "=".repeat(50));
    console.log("All examples completed successfully!");
  } catch (error) {
    console.error("\nError:", error.message);
  }
}

// Run the examples
main();
