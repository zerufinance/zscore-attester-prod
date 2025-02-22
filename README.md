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

1. Configure any environment variables if needed

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### GET /task/validate

Validates wallet scores using merkle proofs. Returns:

```json
{
  "data": boolean,
  "error": boolean,
  "message": string | null
}
```

- Returns `true` if at least 2 out of 3 wallets are successfully validated.
- Returns `false` otherwise.

#### Request Parameters

- **proofOfTask**: (string) The proof of task to validate wallets against.
- **walletAddresses**: (array of strings) The list of wallet addresses to validate.

#### Example Request

```bash
curl -X POST http://localhost:4002/task/validate -H 'Content-Type: application/json' -d '{"proofOfTask": "0xabcdef"}'
```

### Environment Variables

Ensure the following environment variables are set:

- **PRIVATE_KEY_ATTESTER**: (string) The private key for attestation.

## Error Handling

The application includes comprehensive error handling for:

- External API failures.
- Invalid wallet data received from the external API.
- Invalid merkle proofs.
- Invalid input data.
- Server errors.

## Logging

Logging is implemented using NestJS's built-in Logger, providing detailed information about:

- API requests
- Validation results
- Error details
- Debug information in development
