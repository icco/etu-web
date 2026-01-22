#!/bin/bash

# API Endpoint Test Examples for Etu Server
# This file demonstrates how to use the Etu Server REST API

# Configuration
API_KEY="etu_your_api_key_here"
BASE_URL="http://localhost:3000/api/v1"

echo "Etu Server API Examples"
echo "======================="
echo ""

echo "1. List all notes"
echo "   curl -H \"Authorization: \$API_KEY\" \\"
echo "     \"\$BASE_URL/notes\""
echo ""

echo "2. Create a new note"
echo "   curl -X POST \\"
echo "     -H \"Authorization: \$API_KEY\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"content\":\"My first note\",\"tags\":[\"journal\"]}' \\"
echo "     \"\$BASE_URL/notes\""
echo ""

echo "3. Get a specific note"
echo "   curl -H \"Authorization: \$API_KEY\" \\"
echo "     \"\$BASE_URL/notes/{note_id}\""
echo ""

echo "4. Update a note"
echo "   curl -X PUT \\"
echo "     -H \"Authorization: \$API_KEY\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"content\":\"Updated content\"}' \\"
echo "     \"\$BASE_URL/notes/{note_id}\""
echo ""

echo "5. Delete a note"
echo "   curl -X DELETE \\"
echo "     -H \"Authorization: \$API_KEY\" \\"
echo "     \"\$BASE_URL/notes/{note_id}\""
echo ""

echo "6. List all tags"
echo "   curl -H \"Authorization: \$API_KEY\" \\"
echo "     \"\$BASE_URL/tags\""
echo ""

echo "7. Search notes"
echo "   curl -H \"Authorization: \$API_KEY\" \\"
echo "     \"\$BASE_URL/notes?search=meeting\""
echo ""

echo "8. Filter notes by tags"
echo "   curl -H \"Authorization: \$API_KEY\" \\"
echo "     \"\$BASE_URL/notes?tags=work,important\""
echo ""

echo "Instructions:"
echo "1. Generate an API key in the web interface (Settings page)"
echo "2. Replace 'etu_your_api_key_here' with your actual API key"
echo "3. Replace '{note_id}' with an actual note ID from your account"
echo "4. Run the commands above to interact with the API"
echo ""
echo "For complete documentation, see API.md"
