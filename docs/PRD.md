# Product Requirements Document (PRD)

## Objective
Build a modern, personal finance web application called "SmartFinance" that acts as a beautiful interface on top of Google Sheets.

## Target Audience
The personal user who wants to track money across multiple accounts (myBCA, Jago, SeaBank) and cash, but finds directly editing Google Sheets cumbersome.

## Features
1. **Dashboard**: High-level overview of total balance, available money, income, expenses, and health score.
2. **Transaction Management**: Add income, expense, and transfer transactions directly into Google Sheets.
3. **Budget Buckets**: Create and track financial buckets (e.g., Emergency Fund, Vacation).
4. **Available Money System**: Calculate available money by subtracting savings from total assets.
5. **Monthly Planner**: Visual breakdown of income, expenses, and savings rate.
6. **Cash Wallet**: Track physical cash separately.
7. **Financial Health Score**: Deterministic 0-100 score based on financial metrics.
8. **Wishlist/Goals**: Track progress for specific goals.

## Out of Scope
- Full banking app integration
- AI chat assistants
- Cryptocurrency or investment tracking
- Multi-user support
- Local databases (Prisma, Supabase, Firebase)
