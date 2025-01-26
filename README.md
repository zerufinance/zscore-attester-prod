# Zscore Attestor

A NestJS server that provides wallet score validation using merkle proofs.

## Features

- Validates wallet scores using merkle proofs
- Integrates with external API to fetch wallet data
- Uses OpenZeppelin's merkle-tree library for secure validation
- Production-ready error handling and logging
- Input validation using class-validator

## Installation

```bash
npm install
```

## Configuration

Before running the application, make sure to:

1. Update the external API endpoint in `src/validator/validator.service.ts`
2. Configure any environment variables if needed

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### GET /validate

Validates wallet scores using merkle proofs. Returns:

```json
{
  "isApproved": boolean
}
```

- Returns `true` if at least 2 out of 3 wallets are successfully validated
- Returns `false` otherwise

## Error Handling

The application includes comprehensive error handling for:
- External API failures
- Invalid merkle proofs
- Invalid input data
- Server errors

## Logging

Logging is implemented using NestJS's built-in Logger, providing detailed information about:
- API requests
- Validation results
- Error details
- Debug information in development
