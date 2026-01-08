# simple_agent_js

A MongoDB Database Agent powered by Google's Gemini AI. This interactive CLI tool allows you to manage users in a MongoDB database through natural language conversations. The agent uses function calling to perform database operations like creating, finding, listing, and deleting users.

## Features

- **Interactive CLI Interface**: Chat with the AI agent using natural language
- **User Management**: Create, find, list, check existence, and delete users
- **Function Calling**: The AI agent automatically calls appropriate tools based on your requests
- **MongoDB Integration**: Direct connection to MongoDB for database operations
- **Smart Operations**: The agent checks for user existence before deletion and asks for confirmation

## Prerequisites

- [Bun](https://bun.com) runtime (v1.3.6 or later)
- MongoDB database instance
- Google Gemini API key

## Installation

To install dependencies:

```bash
bun install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
```

### Getting Your API Keys

1. **MongoDB URI**: 
   - If using MongoDB Atlas: Get your connection string from the Atlas dashboard
   - If using local MongoDB: Use `mongodb://localhost:27017` or your custom connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/` or `mongodb://localhost:27017`

2. **Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env` file

## Running the Project

To start the MongoDB Database Agent:

```bash
bun run index.ts
```

Once running, you can interact with the agent by typing commands. The agent will:
- Automatically create users when you provide name and email
- List users when asked
- Find users by email
- Check if users exist
- Delete users (with confirmation)

Type `exit` to quit the application.

## Example Usage

```
You: Create a user named John Doe with email john@example.com
AI: [Agent] Executing: create_user
    User created successfully!

You: List all users
AI: [Agent] Executing: list_users
    Here are the users in the database: ...

You: Find user with email john@example.com
AI: [Agent] Executing: find_user
    User found: { name: "John Doe", email: "john@example.com" }

You: exit
```

## Database Structure

The agent connects to a MongoDB database named `agentic_test` and uses a collection called `users`. Each user document can contain:
- `name` (string, required)
- `email` (string, required)
- `age` (number, optional)

## Dependencies

- `@google/genai`: Google Gemini AI SDK for function calling and chat
- `mongodb`: MongoDB driver for Node.js/Bun

## Project Info

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
