# Gundamaxing Threat Model — Anti-Spam & Anti-Bot Defense

## Overview

Gundamaxing employs defense-in-depth against automated account creation (OWASP OAT-019) and content spamming (OWASP OAT-016). Multiple independent layers ensure no single bypass compromises the system.

## Layered Defense Architecture

```
                     ┌─────────────────────┐
                     │  Cloudflare / CDN    │  ← Layer 0: DDoS protection
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Rate Limiter        │  ← Layer 1: IP + account throttling
                     │  (Upstash Redis)     │
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Honeypot Fields     │  ← Layer 2: Bot trap (invisible fields)
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Timing Validation   │  ← Layer 3: Form submission speed check
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Gundam CAPTCHA      │  ← Layer 4: Custom visual puzzle
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Email Verification  │  ← Layer 5: Proof of email ownership
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Risk Scoring        │  ← Layer 6: Behavioral analysis
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Reputation Gating   │  ← Layer 7: Progressive trust
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Spam Heuristics     │  ← Layer 8: Content analysis
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │  Moderation Queue    │  ← Layer 9: Human review
                     └──────────┘
```

## Layer Details

### Layer 1: Rate Limiting
- **Signup**: 3 attempts per hour per IP
- **Login**: 10 attempts per 15 minutes per IP
- **Comments**: 5-60 per day depending on account age
- **Builds**: 3 per hour per user
- **Threads**: 2 per hour per user
- **Implementation**: Upstash Redis sliding window with in-memory fallback
- **Admin knob**: Rate limits are configurable per tier in `rate-limiter.ts`

### Layer 2: Honeypot Fields
- Invisible form fields that humans never fill but bots auto-populate
- Field names rotate from a predefined list
- If any honeypot is filled → silent rejection (no error message to attacker)
- Event logged for admin visibility

### Layer 3: Timing Validation
- Encrypted timestamp injected when form renders
- Submissions faster than 3 seconds are rejected (human minimum typing time)
- Prevents form-fill bots that POST directly
- **Admin knob**: Minimum seconds configurable

### Layer 4: Gundam CAPTCHA
- Custom SVG-based challenges (not reCAPTCHA):
  - **Silhouette Match**: Select which mech outline matches the reference
  - **Armor Alignment**: Pick the correct rotation of an armor plate
  - **Loadout Match**: Identify the correct equipment combination
- Server-issued challenge_id with bcrypt-hashed answer + 5-minute expiry
- Used during registration and when risk score is elevated
- **Accessible fallback**: Text-based logic puzzles for screen readers
- **Admin knob**: Can enable Cloudflare Turnstile as additional layer via `TURNSTILE_ENABLED`

### Layer 5: Email Verification
- Required before posting any content (comments, builds, threads)
- Verification token expires in 24 hours
- Prevents throwaway account mass creation
- **Admin knob**: Disposable email domain blocklist in `ip-utils.ts`

### Layer 6: Risk Scoring (0-100)
- **Factors**:
  - Account age (newer = higher risk)
  - Email not verified (+30)
  - Low reputation (+20)
  - Registration from known VPN/datacenter IP ranges (+15)
  - Disposable email domain (+25)
  - Multiple failed CAPTCHA attempts (+10 each)
  - Previous flags on account (+10 each)
- **Thresholds**:
  - Score > 70: Require Cloudflare Turnstile verification
  - Score > 90: Block action entirely
- **Admin knob**: Thresholds and factor weights configurable

### Layer 7: Reputation Gating
Progressive trust system — new accounts earn privileges over time:

| Account Age | Reputation | Comment/day | Threads/day | Builds/day | Links/comment |
|---|---|---|---|---|---|
| < 24 hours | any | 3 | 0 | 0 | 0 |
| 1-7 days | < 10 | 10 | 1 | 1 | 1 |
| 7-30 days | < 50 | 30 | 5 | 5 | 3 |
| > 30 days | ≥ 50 | 60 | 20 | 20 | unlimited |

Reputation increases from: receiving upvotes (+1), having builds featured (+10), being verified (+5), helpful comments (+1). Decreases from: receiving reports (-5), content deleted by mod (-10).

- **Admin knob**: All thresholds in reputation gating table are configurable

### Layer 8: Spam Heuristics
Real-time content analysis before publishing:
- **Link density**: New accounts cannot post links; established accounts flagged if >3 links in comment
- **Duplicate detection**: Jaccard similarity > 80% against user's last 5 comments → reject
- **All-caps detection**: >50% uppercase content → flag for review
- **Rapid posting**: Comments submitted in rapid succession → progressive cooldown
- **Keyword filtering**: Known toxicity patterns → soft flag (not hard block)

Soft actions philosophy: **flag and collapse, don't hard block**, to avoid false positives. Moderators review flagged content.

### Layer 9: Moderation Queue
- All flagged content enters moderator queue
- Moderators can: dismiss, warn, delete content, ban user
- Ban types: temporary (with expiry) or permanent
- All moderation actions logged with moderator ID and reason

## Event Logging
Every security event is logged to the `EventLog` table:
- Signup attempts (success/blocked)
- CAPTCHA served/passed/failed
- Rate limit hits
- Comment blocks
- Content flags
- Report creation
- Moderation actions

Admin dashboard provides real-time visibility into all events with filtering by type, user, IP, and date range.

## Attack Scenarios & Responses

| Attack | Primary Defense | Secondary Defense | Admin Action |
|---|---|---|---|
| Bot registration | CAPTCHA + honeypot | Rate limit + timing | Review event logs |
| Credential stuffing | Rate limit (10/15min/IP) | Risk scoring | Ban IP range |
| Comment spam | Reputation gating | Spam heuristics | Review mod queue |
| Link spam / SEO spam | Link restrictions for new accounts | Content analysis | Delete + ban |
| Account farming | Email verification + progressive trust | Risk scoring | Mass ban by ASN |
| Toxicity / harassment | Keyword flags | Community reports | Warn → mute → ban |
| CAPTCHA solving services | Secondary Turnstile layer | Behavioral analysis | Increase challenge difficulty |

## Knobs for Admins
1. Rate limit thresholds (per endpoint)
2. Timing minimum seconds
3. Risk score factor weights and thresholds
4. Reputation gating tiers
5. Disposable email domain blocklist
6. Spam keyword list
7. Turnstile enable/disable flag
8. CAPTCHA challenge expiry duration
9. Duplicate detection similarity threshold
10. Auto-collapse threshold for flagged content
