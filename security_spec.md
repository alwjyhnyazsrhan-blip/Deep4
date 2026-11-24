# Security Specification for kingofdeep

## Project
- Firebase Project: `kingofdeep`
- Database: Firestore `(default)`

## Data Invariants & Access Control

### 1. User Profiles (`/users/{userId}`)
- **Owner**: `userId == request.auth.uid`
- **Read**: Allowed for player lookup during login/registration, leaderboards, clan rosters, and visiting harbors (`users` contains public captain gameplay state).
- **Create**: Restricted strictly to authenticated owner (`request.auth.uid == userId` and `userId` matches `data.userId`).
- **Update**: Allowed for the document owner (`request.auth.uid == userId`), OR signed-in multiplayer interactions affecting strictly allowlisted PvP/support fields (`ships`, `portDestroyed`, `battleReports`, `activeAd`, `lastDetonationMessage`, `gold`, `updatedAt`).
- **Delete**: Restricted strictly to the document owner (`request.auth.uid == userId` or `resource.data.userId == request.auth.uid`).

### 2. Tribes (`/tribes/{tribeId}`)
- **Read**: Authenticated players.
- **Create**: Authenticated players where `leaderId == request.auth.uid`, valid tribe shape, bounded `members` array (`<= 100`).
- **Update**: Tribe leader OR signed-in members performing bounded join/leave/donation updates (`members`, `membersCount`, `donations`, `power`, `level`, `lastUpdated`).
- **Delete**: Tribe leader (or last remaining member when deleting account).

### 3. Global Chat Messages (`/chats/{chatId}`)
- **Read**: Authenticated players.
- **Create**: Authenticated players where `senderId == request.auth.uid` and `userId == request.auth.uid`, with strict key and length limits.
- **Update/Delete**: Author only (`senderId == request.auth.uid` or `userId == request.auth.uid`).

### 4. Friend Requests (`/friendRequests/{requestId}`)
- **Read**: Only sender (`senderId == request.auth.uid`) or receiver (`receiverId == request.auth.uid`).
- **Create**: Authenticated sender (`senderId == request.auth.uid`) to a distinct `receiverId` with initial status `'PENDING'`.
- **Update**: Receiver only (`receiverId == request.auth.uid`), transitioning `'PENDING'` -> `'ACCEPTED'` or `'DECLINED'` via `affectedKeys().hasOnly(['status'])`.
- **Delete**: Sender or receiver.

### 5. Harbor Events (`/harborEvents/{eventId}`)
- **Read**: Only attacker (`attackerId == request.auth.uid`) or defender (`defenderId == request.auth.uid`).
- **Create**: Authenticated attacker (`attackerId == request.auth.uid`) targeting a distinct `defenderId` with status `'PENDING'`.
- **Update**: Participant updating `status` from `'PENDING'` to `'PROCESSED'` or `'RESOLVED'`.
- **Delete**: Participant (`attackerId` or `defenderId`).

### 6. Support Tickets (`/support_tickets/{ticketId}`)
- **Create**: Authenticated user matching `userId == request.auth.uid` with server timestamp (`createdAt == request.time`) and `status == 'open'`.
- **Read/Update/Delete**: Author only (`resource.data.userId == request.auth.uid`).

### 7. Global Notifications (`/globalNotifications/{notifId}`)
- **Read**: Authenticated players (`isSignedIn()`).
- **Create**: Authenticated players where `authorId == request.auth.uid` and `senderId == request.auth.uid`, valid `type` (`ATTACK`, `SUPPORT`, `MILESTONE`, `SYSTEM`), strict key and length limits.
- **Update/Delete**: Denied (`false`) — notifications are immutable append-only broadcasts.

### 8. Connection Healthcheck (`/test/connection`)
- **Read**: Allowed strictly for `docId == 'connection'`.
- **Write**: Denied (`false`).

## Dirty Dozen Adversarial Payloads (Must All Fail with `PERMISSION_DENIED`)
1. Unauthenticated create on `/globalNotifications/{id}` -> DENIED (`request.auth == null`)
2. Identity spoofing on `/globalNotifications/{id}` (`authorId != request.auth.uid` or `senderId != request.auth.uid`) -> DENIED
3. Ghost/shadow field injection on `/globalNotifications/{id}` (extra `isAdmin: true` key) -> DENIED (`hasOnly` check)
4. Oversized message/title (>500 / >120 chars) on `/globalNotifications/{id}` -> DENIED
5. Invalid path ID poisoning (`../evil` or 1.5KB ID) -> DENIED (`isValidId`)
6. Unauthenticated or spoofed `senderId` on `/chats/{id}` -> DENIED
7. Updating/deleting another user's `/chats/{id}` -> DENIED
8. Reading another user's `/harborEvents/{id}` where caller is neither `attackerId` nor `defenderId` -> DENIED
9. Creating `/harborEvents/{id}` with `status: 'PROCESSED'` or self-targeting `defenderId == attackerId` -> DENIED
10. Sender accepting their own `/friendRequests/{id}` -> DENIED (receiver only)
11. Reading another player's `/support_tickets/{id}` -> DENIED
12. Creating `/users/{otherUid}` as a non-owner or deleting `/users/{otherUid}` -> DENIED
