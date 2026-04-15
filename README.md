# Wallet Service – Full Stack Assessment

# 📑 Table of Contents

1. [Project Overview](#project-overview)  
2. [System Architecture](#system-architecture)  
   - [High-Level Architecture](#high-level-architecture)  
   - [Request Flow](#request-flow)  
   - [Authentication Flow](#authentication-flow)  

3. [Backend Architecture](#backend-architecture)  
   - [Module Structure](#module-structure)  
   - [Ledger-Based Accounting Design](#ledger-based-accounting-design)  
   - [Data Model Overview](#data-model-overview)  

4. [Financial Correctness & Consistency](#financial-correctness--consistency)  
   - [Atomic Transfers](#atomic-transfers)  
   - [Double-Spending Prevention](#double-spending-prevention)  
   - [Idempotency](#idempotency)  
   - [Failure Handling](#failure-handling)  

5. [Concurrency Handling](#concurrency-handling)  

6. [Security Considerations](#security-considerations)  
   - [Authentication](#authentication)  
   - [Authorization](#authorization)  
   - [Input Validation](#input-validation)  
   - [Duplicate Submission Protection](#duplicate-submission-protection)  
   - [Trade-offs](#trade-offs)  

7. [API Design](#api-design)  
   - [Response Structure](#response-structure)  
   - [Error Handling Philosophy](#error-handling-philosophy)  
   - [Endpoints Overview](#endpoints-overview)  

8. [Frontend Architecture](#frontend-architecture)  
   - [Tech Stack](#tech-stack)  
   - [Design Principles](#design-principles)  
   - [Key Components](#key-components)  
   - [Data Flow](#data-flow)  
   - [Error Handling](#error-handling)  

9. [Development Environment & Setup](#development-environment--setup)  
   - [Project Structure](#project-structure)  
   - [Docker Setup](#docker-setup)  
   - [Running the Project](#running-the-project)  
   - [Access Points](#access-points)  

10. [Testing & Validation](#testing--validation)  
    - [Manual Testing](#manual-testing)  
    - [Concurrency Testing](#concurrency-testing)  

11. [Trade-offs & Decisions](#trade-offs--decisions)  

12. [Scaling Considerations](#scaling-considerations)  
    - [Database Scaling](#database-scaling)  
    - [Write Scaling](#write-scaling)  
    - [Caching Strategy](#caching-strategy)  
    - [Idempotency at Scale](#idempotency-at-scale)  
    - [API Scaling](#api-scaling)  
    - [Observability](#observability)  

13. [Monitoring & Observability](#monitoring--observability)  

14. [Demo](#demo)  

15. [Future Improvements](#future-improvements)  

16. [Assumptions](#assumptions)  


## Project Overview

This project is a full stack implementation of a wallet service designed to demonstrate strong engineering fundamentals in backend architecture, financial correctness, concurrency handling, and frontend integration.

At its core, the system allows users to:
- Create accounts
- Fund wallets
- Transfer funds between users
- View transaction history
- Retrieve wallet balances

While these features may appear straightforward, the primary focus of this implementation is not feature completeness but correctness under real-world constraints. Financial systems must guarantee that balances remain accurate even in the presence of concurrent requests, retries, partial failures, and unexpected system interruptions.

This implementation therefore prioritizes:
- Deterministic and auditable financial operations
- Clear and predictable data flows
- Strong consistency guarantees over convenience
- Simplicity in design to reduce hidden complexity

The system avoids shortcuts such as storing balances directly and instead models financial state using a ledger-based approach. This ensures that every change in balance can be traced and verified.

---

##  System Architecture

#### High-Level Architecture

The system is composed of the following components:

- Backend API (NestJS)
- Frontend Application (Next.js)
- PostgreSQL Database
- Reverse Proxy (Nginx)
- Docker for orchestration

The backend exposes REST endpoints, the frontend consumes these endpoints, and Nginx serves as a unified entry point for both services.

A typical deployment looks like:


#### Request flow
![Request flow diagram](https://github.com/Varsilias/lance-engineering/blob/main/diagrams/request-flow.png)

**Nginx routes:**
- `/api/*` → Backend
- `/` → Frontend

The backend processes requests using transactional guarantees where necessary and returns a normalized response structure.


## Authentication Flow

Authentication is implemented using JWT.
![Authentication flow diagram](https://github.com/Varsilias/lance-engineering/blob/main/diagrams/auth-flow.png)

The token contains the user identifier and is validated on every protected request.

---

## Backend Architecture

#### Module Structure

The backend is structured into focused modules:

- Auth Module: Handles authentication and token issuance
- User Module: Manages user creation and retrieval
- Wallet Module: Handles wallet operations
- Transaction Module: Represents high-level financial operations
- Ledger Module: Stores immutable financial entries

Each module has a single responsibility and communicates through well-defined interfaces.


#### Ledger-Based Accounting Design

The system does not store wallet balances directly.

Instead, balances are derived from ledger entries:

- CREDIT entries increase balance
- DEBIT entries decrease balance

This approach ensures:
- Full auditability
- No silent corruption of balances
- Ability to reconstruct state at any time
- Extensibility for future goals if needed. E.G fee charges, external provider integration etc


#### Data Model Overview

Core entities:

- Users
- Wallets (1:1 with users)
- Transactions (high-level operations)
- Ledger Entries (source of truth for balance)

Each transfer results in:
- One transaction record
- Two ledger entries (debit + credit)

---

## Financial Correctness & Consistency

#### Atomic Transfers

All transfer operations are executed within a database transaction.

Either:
- All steps succeed, or
- Everything is rolled back

This guarantees consistency even in failure scenarios.


#### Double-Spending Prevention

To prevent multiple concurrent deductions:

- Sender wallet is locked using pessimistic locking
- Transactions are processed sequentially per wallet

This ensures a user cannot spend the same funds twice.

#### Idempotency

Each financial operation requires a unique reference.

- Stored in the transactions table
- Enforced via unique constraint

If a duplicate request is received:
- The original transaction is returned
- No duplicate processing occurs

#### Failure Handling

Failures are handled explicitly:

- Any error during processing triggers rollback
- No partial state is persisted
- System remains consistent under all failure conditions

---

## Concurrency Handling

Concurrency is addressed through:

- Database transactions
- Pessimistic locking
- Lock ordering to avoid deadlocks

Multiple concurrent transfers involving the same wallet are safely serialized.

---

## Security Considerations

#### Authentication

- JWT-based authentication
- Stateless and scalable


#### Authorization

- User identity derived from token
- No trust placed on client-provided identifiers


#### Input Validation

- DTO validation using class-validator
- Ensures data integrity at entry point

#### Duplicate Submission Protection

- Idempotency keys either provided by the client or generated on the backend prevent duplicate financial actions

#### Trade-offs

- No refresh tokens (simplified model)
- Token stored client-side
- No session based implementation
- Suceptible to Timing attack

---

## API Design

#### Response Structure

All responses follow a consistent format:

```json
{
  "status": boolean,
  "message": "string",
  "data": {},
  "status_code": number
}
```

#### Error Handling Philosophy

Errors include:

- Machine-readable message
- Human-readable message inside `data.message`

Example:
```json
{
  "status": false,
  "message": "insufficient_funds",
  "data": {
    "message": "Insufficient funds"
  }
}
```

#### Endpoints Overview
- POST /auth/register
- POST /auth/login
- GET /me
- POST /wallet/deposit
- POST /wallet/transfer
- GET /wallet/{user_id}/balance
- GET /wallet/{user_id}/transactions

---

## Frontend Architecture
#### Tech Stack
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

#### Design Principles
- Minimal UI (white, black, grey)
- No unnecessary abstractions
- Centralized API handling

#### Key Components
- AuthContext (global auth state)
- API client (fetch abstraction)
- Pages (auth, dashboard)

#### Data Flow
![Data flow diagram](https://github.com/Varsilias/lance-engineering/blob/main/diagrams/data-flow.png)

#### Error Handling
Errors are normalized at API layer and surfaced as human-readable messages.

---

## Development Environment & Setup

#### Project Structure
```txt
/wallet-service
  /api
  /app
/infra
```
#### Docker Setup

Services include:

- API
- Frontend
- PostgreSQL
- Nginx

#### Running the Project
```bash
docker compose up --build
```

If you have [make](https://www.gnu.org/software/make) installed on your machine, you can also run the project like so:
```bash
make up
```

#### Access Points
Both the `Frontend` and the `API` are running behind an Nginx Proxy which listens on port `3000`. All HTTP calls that starts with **/api** is routed to the API.
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api/v1 
---

## Testing & Validation
#### Manual Testing
- API tested via Postman
- UI tested through flows

---
## Concurrency Testing
I wrote a custom script to simulate 50 concurrent requests that simulates the following:

- Multiple concurrent transfers
- Validates balance correctness
- Confirms idempotency behavior

---

## Trade-offs & Decisions

This implementation intentionally prioritizes correctness, clarity, and simplicity over premature optimization or production-level hardening. The following trade-offs were made deliberately:

- **No Stored Balances**  
  Wallet balances are not stored directly. Instead, they are derived from records in the `ledger_entries` table. This approach ensures strong financial correctness and auditability, as every balance can be reconstructed from first principles. The trade-off is increased computational cost at scale, particularly for read-heavy operations. In a production system, this would likely be complemented with caching or precomputed balance snapshots.

- **No Caching Layer**  
  No caching mechanism was introduced in this implementation. While this simplifies the system and avoids cache invalidation complexity, it also means that all balance computations and reads hit the database directly. In a production environment, I would introduce caching early, particularly for derived values such as wallet balances, with clear invalidation strategies tied to write operations.

- **No Refresh Token Strategy**  
  Authentication is implemented using short-lived JWT access tokens without a refresh token mechanism. This reduces complexity for the scope of this exercise. However, in a production system, a refresh token strategy would be necessary to balance security and user experience. This would involve decisions around token lifetimes, rotation policies, and revocation strategies.

- **Minimal UI Focus**  
  The frontend is intentionally minimal and functional. The goal is to clearly demonstrate system capabilities and backend correctness rather than invest in visual polish or advanced UI patterns. In a production setting, this would be expanded to include better user experience, accessibility considerations, and more refined interaction design.

- **Simplified Security Model**  
  While JWT provides stateless authentication, the current implementation assumes that possession of a valid token is sufficient for access. In practice, this is not sufficient for high-sensitivity systems. A more robust approach would involve:
  
  - Introducing a session layer (e.g., Redis) to track active tokens  
  - Supporting token revocation and logout semantics  
  - Detecting suspicious activity (e.g., token reuse across locations)

  This effectively shifts the model from purely stateless authentication to a hybrid session-based approach, improving security at the cost of additional infrastructure and slight latency.

- **Token Storage Strategy**  
  Tokens are currently stored in `localStorage` for simplicity. While this is easy to implement, it exposes the application to risks such as Cross-Site Scripting (XSS). In a production environment, I would prefer using secure, `HttpOnly` cookies for storing tokens. This reduces exposure to XSS attacks and allows the browser to handle token transmission automatically, though it introduces additional considerations such as CSRF protection.


---

## Scaling Considerations
#### Database Scaling
- Table partitioning
- Index tuning
- Read replicas
#### Write Scaling
- Queue-based processing
- Event-driven architecture

#### Caching Strategy
- Cache derived balances
- Invalidate on write

#### Idempotency at Scale
- Redis-backed idempotency store

#### API Scaling
- Horizontal scaling to handle more request
- Load balancing

#### Observability
- Logging
- Metrics
- Distributed tracing(if we scale to a Distributed environment)
---
## Monitoring & Observability
- Structured logs(preferrably in json format for easy querying)
- Error tracking
- Performance monitoring using observability tools

---
## Demo

A short demo video is included to demonstrate:

- Registration
- Deposit
- Transfer
- Transaction history

---

## Future Improvements
- Refresh tokens
- Robust Role-based access control
- Real-time updates
- Improved UI/UX
- Event-driven notifications

---

## Assumptions
- Single currency (Naira)
- No external payment integrations
- Controlled environment