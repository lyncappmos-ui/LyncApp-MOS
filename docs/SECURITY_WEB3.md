
# LyncApp MOS: Web3 Integrity Architecture

## Core Philosophy
The blockchain is utilized as a **Passive Integrity Layer**. We do not force Matatu operators to interact with wallets; instead, the system anchors operational "heartbeats" and "closures" to create a permanent audit trail.

## Layer 1: Data Anchoring (Revenue Protection)
- **Mechanism**: Every operational day is finalized with a SHA-256 hash representing the summation of all tickets issued.
- **On-Chain**: Only the `SaccoID`, `Date`, and `Hash` are stored. 
- **Privacy**: No PII (Passenger Personally Identifiable Information) or individual trip details are uploaded, preserving privacy while proving the aggregate total.

## Layer 2: Verifiable Trust Credentials
- **Mechanism**: When a driver reaches a trust milestone, the system issues a W3C-compliant Verifiable Credential.
- **Portability**: Drivers can present this signed proof to financial institutions for loans or new SACCCOs during hiring.
- **Verification**: The credential is cryptographically signed by the LyncApp MOS Authority Key.

## API Contracts (Simplified)
- `POST /v1/integrity/anchor`: Finalize day and commit hash to Celo.
- `GET /v1/integrity/verify/:txId`: Public endpoint to verify local reports against the chain.
- `POST /v1/operators/:id/credential`: Issue a signed reputation proof.

## Security Considerations
1. **Key Management**: MOS uses a Hardware Security Module (HSM) or secure cloud vault to manage the SACCO anchoring keys.
2. **Offline Resilience**: The system queues hashes locally during internet outages and anchors them sequentially once connectivity returns.
3. **Write-Only Limitation**: By making the chain write-only, we prevent bloat and maintain high-performance operational UX.
