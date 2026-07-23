# Software Requirements Specification (SRS)

## Functional Requirements
- **FR1**: The system must authenticate with Google Sheets using a Service Account.
- **FR2**: The system must read balances and transactions from specific sheets.
- **FR3**: The system must write new transactions to the sheets instantly.
- **FR4**: The system must calculate the Financial Health Score based on deterministic rules.
- **FR5**: The system must differentiate between Total Assets and Available Money.

## Non-Functional Requirements
- **NFR1**: The application must be deployed on Vercel.
- **NFR2**: The UI must be responsive and mobile-friendly.
- **NFR3**: The system must use Next.js App Router and Server Actions.
- **NFR4**: The design must follow a premium, minimal, glassmorphism-inspired aesthetic.
