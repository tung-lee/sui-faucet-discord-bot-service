# SUI Faucet Discord Bot Service

A Discord bot service for managing SUI testnet faucet requests and viewing service statistics.

## Features

### Commands

#### `/faucet`
Request SUI testnet tokens for a specified wallet address.

**Usage:**
```
/faucet address:0x1234...abcd
```

**Parameters:**
- `address` (required): SUI wallet address (0x followed by 64 hex characters)

#### `/stats`
View service statistics with authentication.

**Subcommands:**

1. **`/stats login`** - Authenticate to access statistics
   - `username` (required): Your username
   - `password` (required): Your password

2. **`/stats view`** - View service statistics (requires authentication)

**Usage Flow:**
1. First, authenticate using `/stats login username:your_username password:your_password`
2. Once authenticated, use `/stats view` to see service statistics
3. Use the refresh button to update statistics in real-time

### Authentication

The stats command requires authentication before viewing statistics:

1. **Login Process:**
   - Use `/stats login` with your credentials
   - The bot will authenticate with the service and store your access token
   - Tokens expire after 1 hour for security

2. **Session Management:**
   - Access tokens are stored in memory (for production, use a database)
   - Sessions automatically expire after 1 hour
   - Re-authentication is required after expiration

3. **Security Features:**
   - All interactions are ephemeral (only visible to the user)
   - Tokens are automatically invalidated on authentication errors
   - Session expiration is enforced

### Service Integration

The bot integrates with a SUI faucet service API:

- **Base URL:** Configured via `SUI_FAUCET_SERVICE_URL` environment variable
- **Authentication Endpoint:** `/api/v1/auth/login`
- **Stats Endpoint:** `/api/v1/stats`
- **Faucet Endpoint:** `/api/v1/sui/faucet`

## Environment Variables

Create a `.env` file with the following variables:

```env
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
DISCORD_TOKEN=your_discord_bot_token
SUI_FAUCET_SERVICE_URL=your_service_url
```

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables in `.env`

3. Deploy commands:
```bash
pnpm run dev:commands
```

4. Start the bot:
```bash
pnpm start
```

## Development

- **Development mode:** `pnpm run dev:bot`
- **Command deployment:** `pnpm run dev:commands`

## Architecture

### Command Structure
- Commands are organized in subdirectories under `commands/`
- Each command is a TypeScript module with `data` and `execute` properties
- Commands follow Discord.js v14 patterns

### Event Handling
- Events are loaded from the `events/` directory
- `interactionCreate.ts` handles button interactions for the stats refresh feature
- Global state management for access tokens (in-memory storage)

### Error Handling
- Comprehensive error handling with user-friendly messages
- Automatic token invalidation on authentication errors
- Graceful fallbacks for API failures

## API Endpoints

### Authentication
- **POST** `/api/v1/auth/login`
  - Body: `{ username: string, password: string }`
  - Response: `{ accessToken: string }`

### Statistics
- **GET** `/api/v1/stats`
  - Headers: `Authorization: Bearer <token>`
  - Response: Service statistics object

### Faucet
- **POST** `/api/v1/sui/faucet`
  - Body: `{ walletAddress: string }`
  - Response: Transaction details

## Security Considerations

1. **Token Storage:** Currently uses in-memory storage. For production, implement secure database storage.
2. **Session Management:** Implement proper session cleanup and database persistence.
3. **Rate Limiting:** Consider implementing rate limiting for authentication attempts.
4. **Input Validation:** All user inputs are validated before processing.
5. **Error Handling:** Sensitive information is not exposed in error messages.

## Future Enhancements

- Database integration for persistent token storage
- Role-based access control for statistics
- Additional statistics endpoints
- Real-time notifications for service events
- Enhanced error reporting and monitoring 