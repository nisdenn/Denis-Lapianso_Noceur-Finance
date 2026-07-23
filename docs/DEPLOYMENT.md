# Deployment

## Target Environment
- **Platform**: Vercel
- **Framework**: Next.js (App Router)

## Environment Variables
The following environment variables must be configured in Vercel before deployment:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: The service account email.
- `GOOGLE_PRIVATE_KEY`: The base64 encoded or raw private key.
- `MASTER_SHEET_ID`: The ID of the master Google Sheet for storing user authentication.
- `GOOGLE_SHEET_ID`: Optional fallback ID of the Google Sheet used for data access when not using per-user sheet configuration.

## CI/CD
Vercel will automatically build and deploy the `main` branch. Ensure `npm run build` succeeds without type errors before merging.
