# Buddy Shot Server API Contract

## 1. Scope

This document defines the HTTP API contract for the server in this folder.

- Service: apps/server
- API root: /api/v1
- Content type: application/json
- Auth scheme: Bearer JWT (Authorization header)

## 2. Base URL and Prefix

All endpoints are mounted under:

- /api/v1

Examples:

- /api/v1/health/
- /api/v1/auth/login
- /api/v1/profiles/me
- /api/v1/social/friends/search

## 3. Common Conventions

### 3.1 Headers

- Content-Type: application/json
- Authorization: Bearer <access_token> (required for protected endpoints)

### 3.2 Success Envelope

Successful responses use this shape:

```json
{
  "success": true,
  "data": {},
  "message": "...",
  "meta": {
    "timestamp": "2026-03-16T12:00:00.000Z"
  }
}
```

Notes:

- data may be omitted or null-like depending on endpoint behavior.
- meta.timestamp is always present.

### 3.3 Error Envelope

Error responses use this shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-03-16T12:00:00.000Z"
  }
}
```

### 3.4 Standard Error Codes

- INTERNAL_SERVER_ERROR
- VALIDATION_ERROR
- NOT_FOUND
- UNAUTHORIZED
- FORBIDDEN
- SERVICE_UNAVAILABLE
- PROFILE_VALIDATION_ERROR
- AVATAR_UPLOAD_ERROR
- USERNAME_ALREADY_EXISTS
- EMAIL_VALIDATION_ERROR
- PASSWORD_VALIDATION_ERROR
- IDENTITY_VALIDATION_ERROR
- INVALID_CREDENTIALS
- TOKEN_REVOKED
- TOKEN_REUSE_DETECTED
- SOCIAL_FRIEND_VALIDATION_ERROR
- SOCIAL_FRIEND_CONFLICT_ERROR
- PHOTO_SHARING_VALIDATION_ERROR
- PHOTO_SHARING_CONFLICT_ERROR

## 4. Auth Model

- Access token is a JWT used in Authorization header.
- Refresh endpoint expects raw refresh token; deviceId is optional.
- Protected endpoints require role USER or ADMIN in route-level checks.

## 5. Endpoint Contracts

## 5.1 Health

### GET /api/v1/health/

Checks service and dependency health.

Auth:

- Public

Request body:

```json
null
```

Success 200:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "summary": {
      "total": 1,
      "up": 1,
      "down": 0
    },
    "indicators": [
      {
        "name": "postgresql",
        "status": "up",
        "working": true,
        "details": {
          "reachable": true,
          "latencyMs": 8
        }
      }
    ]
  },
  "message": "All health indicators are operational.",
  "meta": {
    "timestamp": "2026-03-16T12:00:00.000Z"
  }
}
```

Failure 503:

- code: SERVICE_UNAVAILABLE
- details contains the same health payload shape

## 5.2 Identity Access

### POST /api/v1/auth/register

Register user and issue token pair.

Auth:

- Public

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "buddy_user"
  // "device": {
  //   "pushToken": "optional-token",
  //   "deviceId": "optional-device-id",
  //   "platform": "IOS"
  // }
}
```

Success 201 data:

```json
{
  "accessToken": "jwt",
  "refreshToken": "raw-refresh-token",
  "accessTokenExpiresIn": 900,
  "refreshTokenExpiresAt": "2026-03-23T12:00:00.000Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "buddy_user"
  }
}
```

### POST /api/v1/auth/login

Login and issue token pair.

Auth:

- Public

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
  // "device": {
  //   "pushToken": "optional-token",
  //   "deviceId": "optional-device-id",
  //   "platform": "DESKTOP"
  // }
}
```

Success 200 data shape:

- Same as register response data.

### POST /api/v1/auth/refresh

Rotate refresh token and issue new access + refresh pair.

Auth:

- Public

Request body:

```json
{
  "refreshToken": "raw-refresh-token"
  // "deviceId": "device-uuid"
}
```

Success 200 data shape:

- Same as register response data.

### POST /api/v1/auth/logout

Logout current device or all devices.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
null
```

- Requires Authorization: Bearer <access_token>

Request body:

```json
{
  "deviceId": "device-uuid",
  "allDevices": false
}
```

Rules:

- If allDevices is true: revoke all sessions for current user.
- If allDevices is false or omitted: deviceId should be provided.

Success 200:

- data is empty/undefined
- message: Logout successful.

### PATCH /api/v1/auth/me/email

Update current authenticated user's email.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
{
  "email": "new_email@example.com"
}
```

Success 200 data:

```json
{
  "id": "uuid",
  "email": "new_email@example.com",
  "username": "buddy_user"
}
```

Notes:

- Email format is validated.
- Email uniqueness is enforced.

### PATCH /api/v1/auth/me/password

Change current authenticated user's password.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
{
  "currentPassword": "old_password123",
  "newPassword": "new_password123"
}
```

Success 200:

- data is empty/undefined
- message: Password changed successfully.

Notes:

- `currentPassword` must match the existing password.
- `newPassword` must satisfy password policy (8..72 characters).

## 5.3 User Profile

### GET /api/v1/profiles/me

Get current authenticated user profile.

Auth:

- Protected (USER, ADMIN)

Success 200 data:

```json
{
  "userId": "uuid",
  "username": "buddy_user",
  "bio": "Hello",
  "avatarUrl": "https://cdn.example.com/avatars/uuid.jpg",
  "updatedAt": "2026-03-16T12:00:00.000Z"
}
```

### GET /api/v1/profiles/:username

Get profile by username.

Auth:

- Protected (USER, ADMIN)

Path params:

- username: string

Request body:

```json
null
```

Success 200 data shape:

- Same as GET /profiles/me

### PATCH /api/v1/profiles/me

Update current user profile.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
null
```

Request body:

```json
{
  "username": "new_username",
  "bio": "updated bio"
}
```

Notes:

- bio may be null to clear.
- username uniqueness is enforced.

Success 200 data shape:

- Same as GET /profiles/me

### PATCH /api/v1/profiles/me/avatar

Set or remove avatar key.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
null
```

Request body:

```json
{
  "avatarKey": "avatars/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

To remove avatar:

```json
{
  "avatarKey": null
}
```

Success 200 data shape:

- Same as GET /profiles/me

### POST /api/v1/profiles/me/avatar/upload-url

Generate a pre-signed upload URL for avatar image.

Auth:

- Protected (USER, ADMIN)

Request body (pick one of fileExt or contentType):

```json
{
  "fileExt": "jpg"
}
```

or

```json
{
  "contentType": "image/jpeg"
}
```

Success 200 data:

```json
{
  "avatarKey": "avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
  "uploadUrl": "https://<r2-presigned-url>",
  "publicUrl": "https://cdn.example.com/avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
  "expiresInSeconds": 300
}
```

Notes:

- Allowed extensions: jpg, jpeg, png, webp.
- `avatarKey` must be used in `PATCH /profiles/me/avatar` after upload.

### GET /api/v1/profiles/me/qrcode

Generate QR code payload for profile deep link.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
null
```

Success 200 data:

```json
{
  "userId": "uuid",
  "username": "buddy_user",
  "qrCodeBase64": "iVBORw0KGgoAAAANS..."
}
```

## 5.4 Social Friend

### POST /api/v1/social/friends/requests

Send a friend request.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
null
```

Request body:

```json
{
  "addresseeId": "target-user-uuid"
}
```

Success 201 data:

```json
{
  "friendshipId": "friendship-uuid",
  "requesterId": "requester-uuid",
  "addresseeId": "addressee-uuid",
  "status": "PENDING",
  "createdAt": "2026-03-16T12:00:00.000Z",
  "updatedAt": "2026-03-16T12:00:00.000Z"
}
```

### PATCH /api/v1/social/friends/requests/:friendshipId

Accept or reject a friend request.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
null
```

Path params:

- friendshipId: string (required)

Request body:

```json
{
  "action": "accept"
}
```

or

```json
{
  "action": "reject"
}
```

Success 200:

- If action=accept: data is FriendRequestDto (status typically ACCEPTED)
- If action=reject: data may be null

### GET /api/v1/social/friends/requests/incoming

List incoming pending requests.

Auth:

- Protected (USER, ADMIN)

Success 200 data:

```json
[
  {
    "friendshipId": "uuid",
    "status": "PENDING",
    "direction": "INCOMING",
    "counterpart": {
      "userId": "uuid",
      "username": "sender",
      "bio": "bio",
      "avatarKey": "avatars/sender.jpg"
    },
    "createdAt": "2026-03-16T12:00:00.000Z",
    "updatedAt": "2026-03-16T12:00:00.000Z"
  }
]
```

### GET /api/v1/social/friends/requests/outgoing

List outgoing pending requests.

Auth:

- Protected (USER, ADMIN)

Success 200 data:

- Same item shape as incoming, with direction OUTGOING

### GET /api/v1/social/friends

List accepted friends.

Auth:

- Protected (USER, ADMIN)

Success 200 data:

```json
[
  {
    "userId": "uuid",
    "username": "friend_username",
    "bio": "...",
    "avatarKey": "avatars/friend.jpg"
  }
]
```

### DELETE /api/v1/social/friends/:friendUserId

Remove an accepted friendship.

Auth:

- Protected (USER, ADMIN)

Path params:

- friendUserId: string (required)

Request body:

```json
null
```

Success 200:

- data is empty/undefined
- message: Friend removed successfully.

### GET /api/v1/social/friends/search?username=<query>&limit=<n>

Search users by username and return relationship status.

Auth:

- Protected (USER, ADMIN)

Query params:

- username: string (required)
- limit: number (optional, server clamps to 1..50)

Request body:

```json
null
```

Success 200 data:

```json
[
  {
    "userId": "uuid",
    "username": "buddy_user2",
    "bio": "...",
    "avatarKey": null,
    "relationshipStatus": "NONE"
  }
]
```

relationshipStatus values:

- NONE
- FRIEND
- PENDING_INCOMING
- PENDING_OUTGOING

## 5.5 Photo Sharing

### POST /api/v1/photos/upload-direct

Upload a photo file directly to object storage and return image key/url for `POST /photos/send`.

Auth:

- Protected (USER, ADMIN)

Request:

- `multipart/form-data`
- file field name: `file`

Rules:

- Allowed mime types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 10 MB

Success 200 data:

```json
{
  "imageKey": "photos/550e8400-e29b-41d4-a716-446655440000.jpg",
  "imageUrl": "https://cdn.example.com/photos/550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

### POST /api/v1/photos/send

Create a photo sharing record from sender to selected recipients.

Auth:

- Protected (USER, ADMIN)

Request body:

```json
{
  "imageKey": "photos/550e8400-e29b-41d4-a716-446655440000.jpg",
  "caption": "On the way!",
  "recipientIds": ["recipient-user-uuid-1", "recipient-user-uuid-2"]
}
```

Rules:

- `recipientIds` must contain at least 1 id.
- All recipients must be accepted friends of the sender.
- `caption` is optional and max length is 100.

Success 201 data:

```json
{
  "photoId": "photo-uuid",
  "senderId": "sender-uuid",
  "imageKey": "photos/550e8400-e29b-41d4-a716-446655440000.jpg",
  "imageUrl": "https://cdn.example.com/photos/550e8400-e29b-41d4-a716-446655440000.jpg",
  "caption": "On the way!",
  "recipients": [
    {
      "recipientId": "recipient-user-uuid-1",
      "deliveryId": "delivery-uuid-1"
    }
  ],
  "createdAt": "2026-03-16T12:00:00.000Z"
}
```

### GET /api/v1/photos/feed?username=<query>&from=<iso>&to=<iso>&page=<n>&limit=<n>&sort=<asc|desc>

List received photos for current user with filter, pagination and sort.

Auth:

- Protected (USER, ADMIN)

Query params:

- `username`: sender username query (optional, case-insensitive)
- `from`: ISO datetime (optional)
- `to`: ISO datetime (optional)
- `page`: number (optional, default 1)
- `limit`: number (optional, default 20, server clamps to 1..50)
- `sort`: `asc` or `desc` on photo creation time (optional, default `desc`)

Filter semantics:

- Feed always includes only photos delivered to the current authenticated user.
- When `username` is provided, results are narrowed to photos sent by matching username only.

Success 200 data:

```json
[
  {
    "photoId": "photo-uuid",
    "sender": {
      "userId": "sender-uuid",
      "username": "buddy_sender",
      "avatarKey": "avatars/sender.jpg"
    },
    "imageKey": "photos/550e8400-e29b-41d4-a716-446655440000.jpg",
    "imageUrl": "https://cdn.example.com/photos/550e8400-e29b-41d4-a716-446655440000.jpg",
    "caption": "On the way!",
    "createdAt": "2026-03-16T12:00:00.000Z",
    "deliveredAt": "2026-03-16T12:00:00.000Z"
  }
]
```

Success meta:

- Uses pagination metadata via standard envelope `meta.pagination`.

### GET /api/v1/photos/all?username=<query>&from=<iso>&to=<iso>&page=<n>&limit=<n>&sort=<asc|desc>

List all related photos for current user (both sent by current user and received by current user).

Auth:

- Protected (USER, ADMIN)

Query params:

- `username`: sender username query (optional, case-insensitive)
- `from`: ISO datetime (optional)
- `to`: ISO datetime (optional)
- `page`: number (optional, default 1)
- `limit`: number (optional, default 20, server clamps to 1..50)
- `sort`: `asc` or `desc` on photo creation time (optional, default `desc`)

Semantics:

- Includes photos where current authenticated user is the sender.
- Includes photos delivered to current authenticated user.

Success 200 data shape:

- Same as `GET /api/v1/photos/feed` item shape.

Success meta:

- Uses pagination metadata via standard envelope `meta.pagination`.

### GET /api/v1/photos/me?from=<iso>&to=<iso>&page=<n>&limit=<n>&sort=<asc|desc>

List only photos sent by the current authenticated user.

Auth:

- Protected (USER, ADMIN)

Query params:

- `from`: ISO datetime (optional)
- `to`: ISO datetime (optional)
- `page`: number (optional, default 1)
- `limit`: number (optional, default 20, server clamps to 1..50)
- `sort`: `asc` or `desc` on photo creation time (optional, default `desc`)

Semantics:

- Includes only photos where current authenticated user is the sender.
- Does not include photos sent by other users, even if delivered to current user.

Success 200 data shape:

- Same as `GET /api/v1/photos/feed` item shape.

Success meta:

- Uses pagination metadata via standard envelope `meta.pagination`.

### PATCH /api/v1/photos/:photoId/caption

Update caption for a photo owned by the current authenticated user.

Auth:

- Protected (USER, ADMIN)

Path params:

- `photoId`: string (required)

Request body:

```json
{
  "caption": "Updated caption"
}
```

Rules:

- Only the sender (owner) can update caption.
- `caption` is required and max length is 100.

Success 200 data:

```json
{
  "photoId": "photo-uuid",
  "caption": "Updated caption"
}
```

### DELETE /api/v1/photos/:photoId

Delete a photo owned by the current authenticated user.

Auth:

- Protected (USER, ADMIN)

Path params:

- `photoId`: string (required)

Rules:

- Only the sender (owner) can delete the photo.
- Related delivery records are removed by cascade.

Success 200:

- data is empty/undefined
- message: Photo deleted successfully.

### Socket.IO delivery event

The server emits per-recipient real-time events after photo delivery persistence.

Event:

- `photo:recipient`

Payload shape:

```json
{
  "photoId": "photo-uuid",
  "deliveryId": "delivery-uuid",
  "recipientId": "recipient-user-uuid",
  "senderId": "sender-user-uuid",
  "imageUrl": "https://cdn.example.com/photos/550e8400-e29b-41d4-a716-446655440000.jpg",
  "caption": "On the way!",
  "occurredAt": "2026-03-16T12:00:00.000Z"
}
```

Client room binding:

- Socket handshake should provide `userId` in `auth.userId` or `query.userId`.
- Server binds socket to room `user:<userId>`.

## 6. Auth Failure Behavior

Protected endpoints return:

- 401 with code UNAUTHORIZED when authentication is missing/invalid
- 403 with code FORBIDDEN when role check fails

## 7. Not Found Behavior

If route does not exist:

- 404 with code NOT_FOUND
- message: API endpoint not found.

## 8. Notes for Client Teams

- The server uses a standard response envelope for success and error.
- For reject action in friend request response, data can be null; clients should not assume an object.
- This contract reflects current implementation; no request validation middleware is currently enforcing strict schema at transport layer.
- Photo sharing async domain-event handlers are currently in-process and best-effort for media/CDN/feed projection/socket dispatch.

## 9. Avatar Upload Testing Guide (Postman and Frontend)

### 9.1 Prerequisites

- API base: `http://<host>:<port>/api/v1`
- Authorization header: `Bearer <access_token>`
- R2 env vars must be set:
  - `R2_ACCOUNT_ID`
  - `R2_BUCKET_NAME`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_PUBLIC_URL_BASE`

### 9.2 Postman Steps

1. Get presigned URL:

```http
POST /api/v1/profiles/me/avatar/upload-url
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fileExt": "jpg"
}
```

2. Upload file to R2:

```http
PUT <uploadUrl from step 1>
Content-Type: image/jpeg

(binary file body)
```

3. Save avatar key:

```http
PATCH /api/v1/profiles/me/avatar
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "avatarKey": "avatars/<uuid>.jpg"
}
```

4. Verify:

```http
GET /api/v1/profiles/me
Authorization: Bearer <access_token>
```

### 9.3 Frontend (Web/Mobile) Flow

1. Call `POST /profiles/me/avatar/upload-url` with `fileExt` or `contentType`.
2. Upload the picked image to `uploadUrl` using HTTP `PUT` with the file's `Content-Type`.
3. Call `PATCH /profiles/me/avatar` with the returned `avatarKey`.
4. Refresh profile or use the returned `avatarUrl`.

Common pitfalls:

- `uploadUrl` expires quickly (default 5 minutes). Regenerate if it fails.
- `Content-Type` must match the file type you requested.
