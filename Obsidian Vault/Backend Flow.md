# System Architecture

## Backend Flow

The backend is built with Bun's native HTTP server (`Bun.serve`) and a local `bun:sqlite` database. It handles Google OAuth, session management, and piping uploads directly to the Google Drive API.

```mermaid
sequenceDiagram
    participant Client
    participant Server as Bun Server
    participant DB as SQLite DB
    participant GoogleAuth as Google OAuth
    participant GoogleDrive as Google Drive API

    %% Authentication Flow
    rect rgb(240, 248, 255)
        Note over Client, GoogleAuth: 1. Authentication & Session
        Client->>Server: GET /auth/google
        Server-->>Client: 302 Redirect to Google Auth URL
        Client->>GoogleAuth: User logs in & grants consent
        GoogleAuth-->>Server: GET /auth/callback?code=xyz
        Server->>GoogleAuth: Exchange code for Tokens
        GoogleAuth-->>Server: Access & Refresh Tokens
        Server->>DB: Upsert User & Generate API Key
        Server-->>Client: Set Session Cookie & Redirect to /
    end

    %% Feed Retrieval Flow
    rect rgb(255, 250, 240)
        Note over Client, DB: 2. Initial Data Load
        Client->>Server: GET /api/me (with Cookie)
        Server->>DB: Lookup user by Cookie ID
        DB-->>Server: User Data & API Key
        Server-->>Client: JSON { user }
        
        Client->>Server: GET /api/videos
        Server->>DB: SELECT * FROM videos JOIN users
        DB-->>Server: Feed Data
        Server-->>Client: JSON [ videos ]
    end

    %% Upload Flow
    rect rgb(240, 255, 240)
        Note over Client, GoogleDrive: 3. Video Upload
        Client->>Server: POST /api/upload (File + Bearer API_KEY)
        Server->>DB: Verify API_KEY
        DB-->>Server: Valid User Tokens
        Server->>GoogleDrive: Pipe File Stream (create)
        GoogleDrive-->>Server: Return Google Drive File ID
        Server->>DB: INSERT INTO videos (file_id, user_id)
        Server-->>Client: 200 OK (Upload Successful)
    end
```

[[Frontend Flow]]