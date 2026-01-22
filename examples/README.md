# Etu Server API Examples

This directory contains example code demonstrating how to use the Etu Server REST API in different programming languages.

## Available Examples

### 1. Bash/curl (`api-examples.sh`)

A shell script that demonstrates API usage with curl commands.

**Usage:**
```bash
# View examples
./api-examples.sh

# Or run individual commands
curl -H "Authorization: etu_your_key" http://localhost:3000/api/v1/notes
```

### 2. Python (`api-example.py`)

A complete Python client implementation with example usage.

**Prerequisites:**
```bash
pip install requests
```

**Usage:**
```bash
# Edit the file to set your API key
vim api-example.py  # Change API_KEY variable

# Run the example
python3 api-example.py
```

### 3. JavaScript/Node.js (`api-example.js`)

A Node.js client implementation using the Fetch API.

**Prerequisites:**
- Node.js 18+ (for native fetch support)

**Usage:**
```bash
# Edit the file to set your API key
vim api-example.js  # Change API_KEY variable

# Run the example
node api-example.js
```

## Getting Started

1. **Generate an API Key:**
   - Log in to the Etu web interface
   - Go to Settings
   - Click "Generate New API Key"
   - Copy the generated key (it starts with `etu_`)

2. **Update the Examples:**
   - Replace `etu_your_api_key_here` with your actual API key in the example files

3. **Run an Example:**
   - Choose your preferred language
   - Follow the usage instructions above

## Complete Documentation

For complete API documentation, see [../API.md](../API.md).

## What These Examples Demonstrate

Each example demonstrates the following operations:

1. **Create a Note** - POST /api/v1/notes
2. **Get a Note** - GET /api/v1/notes/{id}
3. **Update a Note** - PUT /api/v1/notes/{id}
4. **List Notes** - GET /api/v1/notes
5. **Search Notes** - GET /api/v1/notes?search=query
6. **Filter by Tags** - GET /api/v1/notes?tags=tag1,tag2
7. **List Tags** - GET /api/v1/tags
8. **Delete a Note** - DELETE /api/v1/notes/{id}

## Contributing

If you'd like to add an example in another language (Ruby, Go, PHP, etc.), please submit a pull request!
