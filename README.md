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
    - [Starting Point (Current Implementation)](#1-starting-point-current-implementation)  
    - [Intermediate Scaling (Practical Optimisations)](#2-intermediate-scaling-practical-optimisations)  
    - [Advanced Scaling (High Throughput System)](#3-advanced-scaling-high-throughput-system)  
    - [Observability & Monitoring](#4-observability--monitoring)  
    - [Final Thoughts](#final-thoughts)    

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
![Data Model diagram](https://github.com/Varsilias/lance-engineering/blob/main/diagrams/data-model.png)


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

Scaling a financial system is not just about handling more traffic, it is about doing so without compromising correctness. The system must continue to guarantee that balances are accurate, transactions are atomic, and no form of double spending is possible even under heavy load.

Rather than jumping straight to complex architectures, it is more practical to think about scaling in stages.


### 1. Starting Point (Current Implementation)

The current implementation is intentionally simple and strongly consistent.

- A single PostgreSQL instance
- Ledger-based balance computation
- Synchronous request handling
- No caching layer
- Direct database reads for balance and transaction history

This approach prioritizes correctness and clarity. Every request is processed in real time, and balances are always derived from the source of truth (ledger entries).

**Limitations:**
- As traffic increases, database reads (especially balance aggregation) become expensive
- Write contention increases with concurrent transfers
- The system is vertically scalable but not horizontally resilient
- Latency increases as load grows

This setup works well for low to moderate traffic but will struggle at tens of millions of transactions per day.


### 2. Intermediate Scaling (Practical Optimisations)

At this stage, the goal is to improve performance without fundamentally changing the system design.

#### Database Optimisation

The first step is to make the database more efficient:

- **Indexing**  
  Add indexes on frequently queried fields such as `wallet_id`, `created_at`, and `reference`. This improves read performance significantly.

- **Read Replicas**  
  Introduce read replicas to offload read-heavy operations such as transaction history and balance queries.  
  Trade-off: Slight replication lag, meaning reads may not always reflect the most recent writes.

- **Connection Pooling**  
  Prevent database overload by controlling concurrent connections.


#### Caching Layer

Balances are computed from ledger entries, which becomes expensive over time.

- Introduce a cache (e.g., Redis) for derived values like wallet balance
- Update or invalidate cache on every write operation

Trade-offs:
- Cache invalidation adds complexity
- Slight risk of stale reads if not handled carefully
- Additional infrastructure cost


#### Idempotency at Scale

- Move idempotency checks to Redis instead of relying solely on database constraints
- This reduces database contention for duplicate requests

Trade-off:
- Adds operational complexity
- Requires careful synchronization with database writes


#### API Scaling

- Deploy multiple instances of the API behind a load balancer
- Ensure statelessness (already achieved with JWT)

Trade-off:
- Requires proper request routing and monitoring
- Debugging becomes slightly more complex in distributed setups


### 3. Advanced Scaling (High Throughput System)

At this stage, the system is expected to handle millions of transactions per day reliably.

#### Asynchronous Processing (Queues)

Instead of processing every transaction synchronously:

- Introduce a queue (e.g., Kafka, RabbitMQ)
- Write requests enqueue transaction jobs
- Workers process them sequentially or in controlled parallelism

Benefits:
- Smooths traffic spikes
- Prevents database overload
- Improves system resilience

Trade-offs:
- Increased system complexity
- Eventual consistency (client may not see immediate result)
- Requires retry and failure handling logic


#### Ledger Table Partitioning

As the ledger grows:

- Partition tables by time (e.g., monthly) or wallet_id

Benefits:
- Faster queries on smaller partitions
- Improved write performance

Trade-offs:
- More complex query logic
- Maintenance overhead


#### Balance Snapshots

Instead of always computing balance from scratch:

- Maintain periodic balance snapshots
- Compute recent changes on top of snapshot

Benefits:
- Faster balance queries
- Reduced computation cost

Trade-offs:
- Additional logic for maintaining snapshots
- Slight complexity in ensuring correctness


#### Distributed Locking

For concurrency across multiple instances:

- Use distributed locks (e.g., Redis-based locks)

Trade-offs:
- Adds latency
- Requires careful handling to avoid deadlocks or lock leaks


### 4. Observability & Monitoring

As the system scales, visibility becomes critical.

- **Structured Logging**  
  Logs in JSON format for easier querying

- **Metrics**  
  Track latency, error rates, transaction throughput

- **Tracing**  
  Understand request flow across services

Trade-offs:
- Additional cost for monitoring tools
- Slight performance overhead


### Final Thoughts

The ideal production system is not a single approach but a combination of strategies:

- Strong consistency at the core (ledger + transactions)
- Caching for performance where safe
- Asynchronous processing for scalability
- Horizontal scaling at the API layer
- Observability for operational confidence

The key is to evolve the system gradually, introducing complexity only when necessary. Premature optimisation can make systems harder to reason about, especially in financial contexts where correctness must always come first.

At every stage, the guiding principle remains the same:

> Scale performance without compromising correctness.

---
## Demo
[Watch the video](https://youtu.be/7PBFNFI2GS8)

This short demo video is included to demonstrate:

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