# Salson

A real-time multiplayer quiz platform built with .NET 10, SignalR, React, and Google OAuth. Hosts create quizzes, generate a live game PIN, and players join from any device to answer questions in real time with live scoring and leaderboards.

## Demo Flow

1. Host logs in with Google → creates a quiz with questions
2. Host starts a game → gets a 6-digit PIN
3. Players go to the join page → enter PIN and nickname
4. Host starts the game → questions broadcast to all players simultaneously
5. Players tap answers → scores update in real time
6. Game ends → leaderboard shown to everyone

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | .NET 10, ASP.NET Core Web API |
| Real-time | SignalR (WebSockets) |
| Database | SQL Server (LocalDB for development) |
| ORM | Entity Framework Core 10 |
| Auth | Google OAuth 2.0 (cookie-based) |
| Frontend | React 18, Tailwind CSS 3 |

## Project Structure
Kahoot clone/
├── kahoot/                     # .NET solution
│   ├── kahoot.Api/             # Controllers, SignalR hub, Program.cs
│   ├── kahoot.Core/            # Entity models, DTOs
│   └── kahoot.Infrastructure/  # EF Core DbContext, migrations
└── salson-client/              # React frontend
└── src/
├── pages/              # Route-level components
├── hooks/              # useAuth
└── services/           # api.js (fetch), signalr.js

## Prerequisites

- .NET 10 SDK
- Node.js 20+
- SQL Server LocalDB (included with Visual Studio)
- A Google Cloud project with OAuth 2.0 credentials

## Backend Setup

**1. Clone the repo**
```bash
git clone https://github.com/Blanksora6/salson.git
cd salson
```

**2. Add your Google OAuth credentials**

Create `kahoot/kahoot.Api/appsettings.Development.json`:
```json
{
  "Authentication": {
    "Google": {
      "ClientId": "YOUR_GOOGLE_CLIENT_ID",
      "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
    }
  }
}
```

**3. Run migrations**

Open Package Manager Console in Visual Studio, set default project to `kahoot.Infrastructure`:


**4. Run the backend**

Set startup profile to `http` and press F5. Backend runs on `http://localhost:5187`.

## Frontend Setup

```bash
cd salson-client
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

## Google OAuth Setup

In Google Cloud Console, add these to your OAuth 2.0 client:

- Authorized JavaScript origins: `http://localhost:5187`
- Authorized redirect URIs: `http://localhost:5187/signin-google`

## Architecture Decisions

**Why three .NET projects?**
Layered architecture — `kahoot.Core` has zero dependencies, `kahoot.Infrastructure` handles data access, `kahoot.Api` is the entry point. Swapping the database only touches Infrastructure.

**Why SignalR instead of polling?**
Real-time games require sub-second updates. Polling would mean players refreshing to see new questions — SignalR maintains a persistent WebSocket connection so the server pushes events instantly to all connected clients.

**Why cookie-based auth instead of JWT?**
Simpler cross-origin setup for a same-network development environment. Cookies carry automatically on every request without client-side token management.

**Why non-unique join codes?**
Kahoot-style 6-digit codes would exhaust a globally unique pool quickly. Codes are only unique among active (`Lobby` or `Active`) sessions — finished sessions free their codes for reuse.

## Entity Relationship

7 entities: `Users`, `Quizzes`, `Questions`, `AnswerOptions`, `GameSessions`, `GameParticipants`, `ParticipantAnswers`.

See `Kahoot_ERD.pdf` for the full schema diagram.
