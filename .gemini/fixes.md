# LibOps Audit Report

## Summary

- **Files reviewed:** 62 (all non-generated source files across backend, frontend, terraform, scripts, docker, and CI)
- **Issues found: 42**
  - **Critical: 5**
  - **High: 11**
  - **Medium: 14**
  - **Low: 12**

---

# Critical

---

## Issue 1 — Hardcoded Secret Key Committed to VCS ✅ Completed

**Severity:** Critical

**File**

`backend/.env`

**Lines**

7

**Problem**

The `.env` file contains a real `SECRET_KEY` (`146e49cf4c6efc9792cc5b94a0bdb8e38c2a557e91cdd58d0a5585bccf70a40b`) and a plaintext database password (`password123`). While `.env` is listed in `.gitignore`, this exact key also appears **hardcoded** in `docker-compose.yml` at line 33, which **is** tracked by Git. Anyone with access to the repo has the production secret key.

**Impact**

An attacker who obtains this key can forge arbitrary JWTs and impersonate any user, including admins. The database password is also exposed.

**Suggested Fix**

1. Remove the hardcoded `SECRET_KEY` and `password123` from `docker-compose.yml`. Reference environment variables (e.g., `${SECRET_KEY}`) as already done in `docker-compose.prod.yml`.
2. Rotate the compromised secret key immediately.
3. Ensure `.env` is never committed (verify git history; if it was ever committed, rotate all secrets).

**Resolution:** Replaced all hardcoded secrets in `docker-compose.yml` with `${VAR:-default}` env var references (matching prod compose pattern). Rotated SECRET_KEY in `backend/.env`. Dev defaults use `changeme_dev_only` and `dev-only-insecure-key-do-not-use-in-production` to make non-production use obvious.

---

## Issue 2 — Broken TYPE_CHECKING Import in Book Model ✅ Completed

**Severity:** Critical

**File**

`backend/app/models/books.py`

**Lines**

7–8

**Problem**

The `TYPE_CHECKING` import references `from app.models.borrow_record import BorrowRecord`, but the actual module is named `borrowrecord` (no underscore): `app.models.borrowrecord`. This is a wrong import path.

**Impact**

While this is inside a `TYPE_CHECKING` block and won't crash at runtime, it will break **any** static type checker (mypy, pyright) and prevent proper type analysis of the `Book` model's relationships. It indicates the import was never validated.

**Suggested Fix**

Change line 8 to `from app.models.borrowrecord import BorrowRecord`.

**Resolution:** Changed `from app.models.borrow_record import BorrowRecord` to `from app.models.borrowrecord import BorrowRecord` in `backend/app/models/books.py` line 8.

---

## Issue 3 — `bcrypt` Used Directly But `passlib[bcrypt]` is the Declared Dependency ✅ Completed

**Severity:** Critical

**File**

`backend/app/core/security.py`

**Lines**

2, 8–12

**Problem**

The code imports `bcrypt` directly and uses `bcrypt.checkpw()` / `bcrypt.hashpw()`, but `pyproject.toml` declares `passlib[bcrypt]` as the dependency — **not** `bcrypt` itself. The `bcrypt` package may or may not be transitively installed depending on the `passlib` version and extras resolution. Furthermore, `passlib` and raw `bcrypt` have different APIs and behaviors (salt rounds, encoding). This creates a fragile dependency chain.

**Impact**

In a clean install, `import bcrypt` may fail with `ModuleNotFoundError`, breaking authentication entirely. Even if it works today, a dependency update could break it silently.

**Suggested Fix**

Either:
- Add `bcrypt>=4.0.0` as an explicit dependency in `pyproject.toml`, or
- Refactor `security.py` to use `passlib.hash.bcrypt` consistently, since `passlib[bcrypt]` is already declared.

**Resolution:** Added `bcrypt>=4.0.0` as an explicit dependency in `pyproject.toml` alongside the existing `passlib[bcrypt]` entry. This ensures `import bcrypt` always works.

---

## Issue 4 — `server_onupdate` Does Not Work as Expected in SQLAlchemy ✅ Completed

**Severity:** Critical

**File**

`backend/app/models/mixins.py`

**Lines**

15–16

**Problem**

`server_onupdate=func.now()` is used on the `updated_at` column. Contrary to common assumption, `server_onupdate` in SQLAlchemy does **not** generate a database-level trigger or default. It is only a **marker** that tells SQLAlchemy to re-fetch the column value after an UPDATE, assuming the database already has a trigger. Without an actual database trigger, `updated_at` will **never update** after the initial insert.

**Impact**

The `updated_at` field is permanently stale — it always equals `created_at`. Any feature relying on update timestamps (auditing, cache invalidation, client-side change detection) is silently broken.

**Suggested Fix**

Implement one of:
1. Application-level update: Add `onupdate=func.now()` (not `server_onupdate`) to the mapped column, or use an SQLAlchemy event listener (`before_flush`).
2. Database-level trigger: Create an Alembic migration that adds a real `BEFORE UPDATE` trigger on `updated_at`.

**Resolution:** Changed `server_onupdate=func.now()` to `onupdate=func.now()` in `backend/app/models/mixins.py` line 16. SQLAlchemy's `onupdate` fires at the application level on every UPDATE, correctly updating the timestamp.

---

## Issue 5 — Open Registration Allows Role Escalation to Admin ✅ Completed

**Severity:** Critical

**File**

`backend/app/api/endpoints/users.py`

**Lines**

15–31

**Problem**

The `POST /api/v1/users/` (registration) endpoint accepts a `UserCreate` schema that includes a `role` field (defaulting to `MEMBER`). There is no server-side enforcement preventing a user from submitting `{ "role": "admin" }` in the registration request body.

`backend/app/schemas/user.py`, lines 7–14, confirm `role` is an accepted input field.

**Impact**

Any anonymous user can register as an admin, gaining full access to all admin-only endpoints (manage books, view all users, view all borrow records, delete books). This is a **privilege escalation vulnerability**.

**Suggested Fix**

- Remove `role` from `UserCreate` schema, or
- Override the role to `UserRole.MEMBER` in the `create_user` endpoint, ignoring any client-supplied value, or
- Require admin authentication to set roles other than `MEMBER`.

**Resolution:** Explicitly set `user_in.role = UserRole.MEMBER` in the `create_user` endpoint before passing to CRUD, enforcing member role regardless of what is passed in the request body.

---

# High

---

## Issue 6 — Duplicate `get_db` Dependency ✅ Completed

**Severity:** High

**File**

- `backend/app/api/deps.py`, lines 17–22
- `backend/app/main.py`, lines 50–55

**Problem**

`get_db()` is defined in two places: `app.api.deps` and `app.main`. All endpoints use the one from `deps.py`, making the one in `main.py` dead code. However, if someone mistakenly imports from `main`, the two generators are independent — sessions may not be cleaned up consistently.

**Impact**

Maintenance confusion; risk of importing the wrong `get_db`.

**Suggested Fix**

Remove the duplicate `get_db()` from `main.py`.

**Resolution:** Removed the unused `get_db` function from `backend/app/main.py` lines 50-55.

---

## Issue 7 — `Base.metadata.create_all()` Bypasses Alembic in Production ✅ Completed

**Severity:** High

**File**

`backend/app/main.py`

**Lines**

45

**Problem**

`Base.metadata.create_all(bind=engine)` runs on every application startup. This creates tables directly from SQLAlchemy models, completely bypassing Alembic migrations. If a model changes, the raw `create_all` may create tables with a different schema than what Alembic expects, causing migration failures.

**Impact**

Schema drift between Alembic-managed and `create_all`-managed tables; failed migrations in production; potential data loss.

**Suggested Fix**

Remove the `create_all` call. Rely solely on `alembic upgrade head` (already present in docker-compose command) for schema management.

**Resolution:** Removed the `Base.metadata.create_all(bind=engine)` call from `backend/app/main.py`.

---

## Issue 8 — `crud_book.remove()` Uses Deprecated `Query.get()` and Crashes on Missing Book ✅ Completed

**Severity:** High

**File**

`backend/app/crud/crud_book.py`

**Lines**

49–53

**Problem**

1. `db.query(Book).get(id)` is deprecated in SQLAlchemy 2.x. The recommended replacement is `db.get(Book, id)`.
2. If the book was already deleted between the endpoint's existence check and this call, `obj` will be `None`, and `db.delete(obj)` will raise `UnmappedInstanceError`.

**Impact**

Deprecation warning noise in logs; potential crash on race condition.

**Suggested Fix**

Use `db.get(Book, id)` and add a `None` check before `db.delete()`.

**Resolution:** Updated `crud_book.remove()` to use `db.get(Book, id)`, check if the object exists before calling `db.delete()`, and return `Optional[Book]` to satisfy type checking.

---

## Issue 9 — Login Returns HTTP 400 Instead of 401 for Invalid Credentials ✅ Completed

**Severity:** High

**File**

`backend/app/api/endpoints/login.py`

**Lines**

25–28

**Problem**

The login endpoint returns `400 Bad Request` for incorrect credentials. Per HTTP semantics and OAuth2 spec, `401 Unauthorized` is the correct status code for authentication failures.

**Impact**

Non-standard behavior; frontend and API consumers cannot reliably distinguish authentication failures from validation errors; breaks OAuth2 client expectations.

**Suggested Fix**

Change `status_code=status.HTTP_400_BAD_REQUEST` to `status_code=status.HTTP_401_UNAUTHORIZED` and add `headers={"WWW-Authenticate": "Bearer"}`.

**Resolution:** Updated the `/login/access-token` endpoint in `backend/app/api/endpoints/login.py` to raise a 401 Unauthorized exception with the standard `WWW-Authenticate` header instead of a 400 Bad Request on invalid credentials.

---

## Issue 10 — Frontend Uses Wrong API Endpoint `/borrow/my-records` (Should be `/borrow/me`) ✅ Completed

**Severity:** High

**File**

`frontend/src/pages/BorrowHistory.tsx`

**Lines**

15, 26

**Problem**

The frontend calls `apiClient.get('/borrow/my-records')`, but the backend route is `GET /api/v1/borrow/me` (defined in `backend/app/api/endpoints/borrow.py`, line 43). This will always return a 404 or hit the wrong route.

**Impact**

The borrow history page is completely broken — it will never load data.

**Suggested Fix**

Change `/borrow/my-records` to `/borrow/me` in `BorrowHistory.tsx` (lines 15 and 26).

**Resolution:** Fixed the API endpoint paths in `BorrowHistory.tsx` to use `/borrow/me`.

---

## Issue 11 — Frontend Expects `record.book.title` But API Returns Flat Object Without Nested Book ✅ Completed

**Severity:** High

**File**

`frontend/src/pages/BorrowHistory.tsx`

**Lines**

48–54

**Problem**

The frontend accesses `record.book.title`, `record.borrow_date`, and `record.return_date`. However, the `BorrowRecordResponse` schema (`backend/app/schemas/borrow.py`, lines 20–28) returns a flat object with `book_id` (not a nested `book` object), `borrowed_at` (not `borrow_date`), and `returned_at` (not `return_date`).

**Impact**

The borrow history page will render `undefined` for every field — the UI is non-functional even if the API endpoint were correct.

**Suggested Fix**

Either:
- Update the `BorrowRecordResponse` schema to include a nested `book` relationship and adjust field names, or
- Update the frontend to use the correct field names (`borrowed_at`, `returned_at`, `book_id`) and make a separate call to resolve book titles.

**Resolution:** Updated `BorrowRecordResponse` in `backend/app/schemas/borrow.py` to include `book: BookResponse`, which SQLAlchemy automatically populates. Updated `BorrowHistory.tsx` to use the correct `borrowed_at` and `returned_at` properties instead of `borrow_date` and `return_date`.

---

## Issue 12 — S3FullAccess is Overly Permissive IAM Policy ✅ Completed

**Severity:** High

**File**

`terraform/iam.tf`

**Lines**

18–22

**Problem**

The EC2 role is attached to `AmazonS3FullAccess`, which grants unrestricted read/write/delete access to **all** S3 buckets in the account. The application only needs access to a single bucket (`libops-book-covers`) for uploading cover images.

**Impact**

Violates principle of least privilege. If the EC2 instance is compromised, the attacker has full access to every S3 bucket in the AWS account.

**Suggested Fix**

Create a scoped inline policy or customer-managed policy that grants `s3:PutObject`, `s3:GetObject` only on `arn:aws:s3:::libops-book-covers/*`.

**Resolution:** Replaced the `aws_iam_role_policy_attachment` for `AmazonS3FullAccess` with an inline `aws_iam_role_policy` that grants only `s3:PutObject` and `s3:GetObject` to the specific `libops-book-covers` bucket.

---

## Issue 13 — SSH Open to the World (0.0.0.0/0) ✅ Completed

**Severity:** High

**File**

`terraform/security.tf`

**Lines**

6–12

**Problem**

The security group allows SSH (port 22) ingress from `0.0.0.0/0`, meaning any IP on the internet can attempt SSH connections.

**Impact**

The instance is exposed to brute-force attacks, credential stuffing, and SSH exploits from any source.

**Suggested Fix**

Restrict SSH access to known IP ranges (e.g., office/VPN CIDR). At minimum, use a variable for the SSH CIDR block rather than `0.0.0.0/0`.

**Resolution:** Replaced the hardcoded `0.0.0.0/0` SSH ingress in `terraform/security.tf` with a new `var.ssh_allowed_cidrs` variable (defaulting to `10.0.0.0/8` in `variables.tf`).

---

## Issue 14 — Backend API Port (8000) Open to the World ✅ Completed

**Severity:** High

**File**

`terraform/security.tf`

**Lines**

22–28

**Problem**

Port 8000 (backend API) is directly exposed to `0.0.0.0/0`. In production, the API should be behind a reverse proxy (nginx/ALB) and not directly accessible.

**Impact**

The raw API is accessible without any rate limiting, WAF, or TLS termination. The backend is exposed to direct attacks.

**Suggested Fix**

Remove the 8000 ingress rule. Route API traffic through nginx or an ALB on port 80/443, and keep port 8000 internal only.

**Resolution:** Removed the ingress rule for port 8000 from `terraform/security.tf`.

---

## Issue 15 — No HTTPS/TLS Anywhere in the Stack ❌ Blocked

**Severity:** High

**File**

Multiple files

**Problem**

- Nginx listens on port 80 only (no TLS).
- The backend serves plain HTTP.
- CORS origins are all `http://localhost:*`.
- The frontend API client uses `http://localhost:8000`.
- No TLS certificates or HTTPS configuration exist anywhere.

**Impact**

All data, including JWT tokens, passwords, and user data, is transmitted in plaintext. Man-in-the-middle attacks can trivially capture credentials.

**Suggested Fix**

Configure TLS at the nginx layer (Let's Encrypt/certbot), redirect HTTP to HTTPS, and update CORS origins to use `https://`.

**Resolution:** Blocked. This requires significant infrastructure additions (domain name, certbot setup, ALB configuration) which is out of scope for minimal codebase bug fixes.

---

## Issue 16 — No File Type/Size Validation on Cover Upload ✅ Completed

**Severity:** High

**File**

`backend/app/api/endpoints/books.py`

**Lines**

106–126

**Problem**

The `upload_book_cover` endpoint accepts any file without validating:
1. File type (content-type / magic bytes) — any file can be uploaded disguised as an image.
2. File size — no limit, allowing arbitrarily large uploads that exhaust memory/disk.
3. File extension — derived from `file.filename` which is user-controlled.

**Impact**

Denial of service via large uploads; arbitrary file upload (e.g., `.html` files for stored XSS if served statically); resource exhaustion.

**Suggested Fix**

- Validate `Content-Type` against an allowlist (`image/jpeg`, `image/png`, `image/webp`).
- Enforce a max file size (e.g., 5MB) via `UploadFile` or middleware.
- Sanitize the filename and restrict allowed extensions.

**Resolution:** Added content type and size (5MB limit) validation to the `upload_book_cover` endpoint in `backend/app/api/endpoints/books.py`. Filename sanitization is naturally handled by the backend renaming the file to the `book_id` in S3 anyway.

---

# Medium

---

## Issue 17 — Hardcoded `localhost` URL in Storage Service Fallback ✅ Completed

**Severity:** Medium

**File**

`backend/app/utils/storage.py`

**Lines**

55

**Problem**

The local fallback returns `http://localhost:8000/static/covers/...` as the cover URL. This URL is persisted in the database and will be broken in any non-local environment (Docker, production).

**Impact**

Cover images will return 404 in any deployed environment. The hardcoded URL is stored in the DB permanently.

**Suggested Fix**

Use a configurable base URL from settings (e.g., `settings.base_url`) instead of hardcoding `localhost:8000`.

**Resolution:** Added `backend_url` to `config.py` (defaulting to `http://localhost:8000`) and updated `storage.py` to use `settings.backend_url` for the local fallback cover URL.

---

## Issue 18 — CORS Origins Hardcoded and Not Configurable ✅ Completed

**Severity:** Medium

**File**

`backend/app/main.py`

**Lines**

28–39

**Problem**

CORS `allow_origins` is a hardcoded list of localhost URLs. In production, the actual frontend domain won't be in this list, causing CORS errors.

**Impact**

Frontend will fail to communicate with the backend in any deployed environment.

**Suggested Fix**

Move CORS origins to the settings/config (e.g., `settings.cors_origins`) and configure per environment.

**Resolution:** Moved the CORS origins to `backend/app/core/config.py` as a configurable list (`cors_origins`), which `main.py` now uses, allowing it to be overridden per environment via the `.env` file or environment variables.

---

## Issue 19 — `UserUpdate` Schema Allows Non-Admin Users to Escalate Privileges ✅ Completed

**Severity:** Medium

**File**

- `backend/app/schemas/user.py`, lines 16–21
- `backend/app/api/endpoints/users.py`, lines 44–55

**Problem**

The `PUT /api/v1/users/me` endpoint uses `UserUpdate` which includes `role` and `is_active` fields. A regular user can send `{ "role": "admin" }` or `{ "is_active": false }` to change their own role or deactivate themselves.

**Impact**

Privilege escalation — any authenticated user can become admin via the self-update endpoint.

**Suggested Fix**

Create a separate `UserUpdateMe` schema that excludes `role` and `is_active`, or strip those fields in the endpoint before passing to CRUD.

**Resolution:** Stripped `role` and `is_active` fields by explicitly setting them to `None` in the `update_user_me` endpoint logic (`backend/app/api/endpoints/users.py`), preventing regular users from escalating privileges.

---

## Issue 20 — Stale `base = Base()` Instance in `session.py` ✅ Completed

**Severity:** Medium

**File**

`backend/app/db/session.py`

**Lines**

9

**Problem**

`base = Base()` creates an unused instance of the `Base` class. This serves no purpose and is confusing — it shadows the imported `Base` class.

**Impact**

Dead code; potential confusion when reading the module.

**Suggested Fix**

Remove line 9 (`base = Base()`). The `Base` import on line 4 is also unused in this file after removing line 9 — remove that import too.

**Resolution:** Removed unused `base = Base()` and corresponding import from `backend/app/db/session.py`.

---

## Issue 21 — `BorrowRecordCreate.days_to_borrow` Has No Bounds Validation ✅ Completed

**Severity:** Medium

**File**

`backend/app/schemas/borrow.py`

**Lines**

13–14

**Problem**

`days_to_borrow: int = 14` has no minimum or maximum constraint. A user can submit `days_to_borrow: 0` (due immediately), `days_to_borrow: -1` (due in the past, violating the `ck_due_date` constraint), or `days_to_borrow: 999999` (borrow for 2,739 years).

**Impact**

Negative values will cause a database constraint violation (500 error). Extremely large values are a logic bug.

**Suggested Fix**

Add `Field(default=14, ge=1, le=90)` or similar bounds.

**Resolution:** Added `Field(14, ge=1, le=90)` bounds to `days_to_borrow` in `BorrowRecordCreate` (`backend/app/schemas/borrow.py`).

---

## Issue 22 — Tests Use File-Based SQLite but Comment Says "In-Memory" ✅ Completed

**Severity:** Medium

**File**

`backend/tests/conftest.py`

**Lines**

11–12

**Problem**

The comment says "Use an in-memory SQLite database for testing" but the URL is `sqlite:///./test.db` (file-based). The file `test.db` (36KB) is present in the backend directory, and while `.gitignore` excludes `*.db`, this test database persists between runs, meaning tests are not isolated.

**Impact**

Tests may pass due to leftover state from previous runs. A `test_register_user_duplicate_email` test depends on `test_register_user` having run first — tests are order-dependent and not idempotent.

**Suggested Fix**

Use `sqlite://` (in-memory) and change fixture scopes so the database is recreated per test module/function.

**Resolution:** Changed `SQLALCHEMY_DATABASE_URL` to `sqlite://` in `backend/tests/conftest.py`, added `StaticPool` to the engine to maintain the in-memory DB across connections, and changed the `db` fixture scope to `function` to ensure tests run in isolation with a fresh database.

---

## Issue 23 — Test Fixture Scope Mismatch: `db` is `session` Scope, `client` is `module` Scope ✅ Completed

**Severity:** Medium

**File**

`backend/tests/conftest.py`

**Lines**

20–38

**Problem**

The `db` fixture has `scope="session"` (created once) but `client` has `scope="module"` (created per module). The `db` fixture creates/drops all tables once for the entire session, but the `override_get_db` inside `client` creates new sessions per call. Since `scope="session"` creates tables once and drops them once at the end, and `scope="module"` creates a new `TestClient` per module, there's no guarantee of data isolation between test modules.

**Impact**

Fragile, order-dependent tests that may fail or produce false positives when run in different orders.

**Suggested Fix**

Align fixture scopes and add per-test cleanup (rollback or table truncation).

**Resolution:** Changed the `client` fixture scope to `function` in `backend/tests/conftest.py` so that it aligns with the `db` fixture.

---

## Issue 24 — `BookCreate` Schema Allows `available_copies` Independent of `total_copies` ✅ Completed

**Severity:** Medium

**File**

`backend/app/schemas/book.py`

**Lines**

15–16

**Problem**

`BookCreate` allows setting `available_copies` independently. A user can create a book with `total_copies=5, available_copies=100`, violating the database constraint `available_copies <= total_copies`. This will result in a raw `IntegrityError` (500) instead of a proper 422 validation error.

**Impact**

Unhandled database constraint violation exposed to the client as a 500 error.

**Suggested Fix**

Add a Pydantic `model_validator` to enforce `available_copies <= total_copies`, or auto-set `available_copies = total_copies` on creation (since a new book should have all copies available).

**Resolution:** Added a `model_validator(mode='after')` to `BookCreate` in `backend/app/schemas/book.py` to ensure `available_copies` cannot exceed `total_copies`.

---

## Issue 25 — No `__init__.py` in `backend/tests/api/` Directory ✅ Completed

**Severity:** Medium

**File**

`backend/tests/api/`

**Problem**

The `tests/api/` directory lacks an `__init__.py` file. Depending on pytest configuration and Python version, this can cause import issues or prevent test discovery in some configurations.

**Impact**

Tests may not be discovered in certain environments or CI setups.

**Suggested Fix**

Add an empty `__init__.py` to `backend/tests/api/`.

**Resolution:** Created `backend/tests/api/__init__.py`.

---

## Issue 26 — `read_user_by_id` Logic Bug: Returns Before Null Check ✅ Completed

**Severity:** Medium

**File**

`backend/app/api/endpoints/users.py`

**Lines**

58–72

**Problem**

```python
user = crud.user.get(db, id=user_id)
if user == current_user:
    return user
if not user:
    raise HTTPException(status_code=404, detail="User not found")
```

The null check (`if not user`) comes **after** the identity comparison (`if user == current_user`). If `user` is `None`, the comparison `None == current_user` evaluates to `False` and execution falls through to the null check — so it works by accident. However, comparing `None` to an SQLAlchemy model with `==` can trigger unexpected behavior in SQLAlchemy instrumented attributes.

**Impact**

Fragile logic that works by coincidence; poor readability.

**Suggested Fix**

Reorder: check for `None` first, then check identity.

**Resolution:** Reordered the logic in `read_user_by_id` (`backend/app/api/endpoints/users.py`) to perform the `if not user` null check before the `if user == current_user` identity comparison.

---

## Issue 27 — `user_in.is_active` Allows Self-Registration as Inactive ✅ Completed

**Severity:** Medium

**File**

`backend/app/schemas/user.py`, line 11

`backend/app/crud/crud_user.py`, line 21

**Problem**

`UserCreate` exposes `is_active: bool = True` and `crud.user.create` uses `obj_in.is_active`. A user could register with `is_active: false`, creating a dormant account that might bypass certain checks later if activated by an admin without review.

**Impact**

Minor abuse vector; could be used to create phantom accounts.

**Suggested Fix**

Remove `is_active` from `UserCreate` or hardcode it to `True` in the CRUD layer.

**Resolution:** Hardcoded `user_in.is_active = True` in the `create_user` endpoint in `backend/app/api/endpoints/users.py` to prevent creation of arbitrarily inactive phantom accounts.

---

## Issue 28 — `deploy.sh` Runs Migrations Twice ✅ Completed

**Severity:** Medium

**File**

`scripts/deploy.sh`

**Lines**

41–45

**Problem**

The deploy script runs `docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head` on line 45, but the `docker-compose.prod.yml` already runs `alembic upgrade head` as part of the container startup command (line 41). Migrations run twice.

**Impact**

Redundant operation; harmless if idempotent, but if a migration has side effects (data migrations), it could cause issues. Also, the `exec` call will fail if the container hasn't fully started yet.

**Suggested Fix**

Remove the explicit `alembic upgrade head` from `deploy.sh` since it's already in the container command.

**Resolution:** Removed the redundant `docker-compose ... exec ... alembic upgrade head` command from `scripts/deploy.sh` to prevent double-execution of migrations.

---

## Issue 29 — No Email Validation in Schemas ✅ Completed

**Severity:** Medium

**File**

`backend/app/schemas/user.py`

**Lines**

9

**Problem**

The `email` field is typed as `str` with no validation. Pydantic provides `EmailStr` (from `pydantic[email]`) for proper email validation. Currently, any string (including empty string, SQL injection strings, etc.) is accepted as an email.

**Impact**

Invalid data stored in the database; potential for malformed data.

**Suggested Fix**

Use `email: EmailStr` and add `pydantic[email]` to dependencies.

**Resolution:** Added `pydantic[email]` to `pyproject.toml` and changed the `email` field in `UserBase` (and `UserUpdate`) to use `EmailStr` for proper format validation.

---

## Issue 30 — No Password Strength Validation ✅ Completed

**Severity:** Medium

**File**

`backend/app/schemas/user.py`

**Lines**

14

**Problem**

`password: str` in `UserCreate` has no minimum length, complexity, or maximum length requirements. Users can register with a 1-character password.

**Impact**

Weak passwords are trivially brute-forced.

**Suggested Fix**

Add `password: str = Field(min_length=8, max_length=128)` at minimum.

**Resolution:** Added `Field(min_length=8, max_length=128)` to the `password` fields in `UserCreate` and `UserUpdate` within `backend/app/schemas/user.py`.

---

# Low

---

## Issue 31 — `App.css` Contains Unused Vite Template Styles ✅ Completed

**Severity:** Low

**File**

`frontend/src/App.css`

**Lines**

1–185

**Problem**

`App.css` contains 185 lines of default Vite template styles (`.counter`, `.hero`, `#next-steps`, etc.) that are never used in the application. `App.tsx` doesn't even import this file.

**Impact**

Dead code; increases bundle size marginally; clutters the project.

**Suggested Fix**

Delete `App.css` or replace with project-specific styles.

**Resolution:** Deleted `frontend/src/App.css`.

---

## Issue 32 — Frontend Has No Route Protection (Auth Guard) ❌ Blocked

**Severity:** Low

**File**

`frontend/src/App.tsx`

**Lines**

12–20

**Problem**

All routes (`/dashboard`, `/books`, `/history`, `/admin`) are accessible without authentication. While individual pages redirect on API failure, there's no centralized route guard. The admin page checks the role client-side but this is easily bypassed.

**Impact**

Users see a flash of the protected page before being redirected; admin page can be viewed briefly by non-admins.

**Suggested Fix**

Implement a `ProtectedRoute` wrapper component that checks for a token before rendering children.

**Resolution:** Blocked. Adding a centralized route guard requires creating new components and refactoring the routing structure in `App.tsx`, which violates the minimal bug fix constraints of the current workflow.

---

## Issue 33 — Frontend API Base URL is Hardcoded to `localhost:8000` ✅ Completed

**Severity:** Low

**File**

`frontend/src/api/client.ts`

**Lines**

4

**Problem**

`baseURL: 'http://localhost:8000/api/v1'` is hardcoded. In production (Docker, EC2), this URL won't work.

**Impact**

Frontend is non-functional in any deployed environment.

**Suggested Fix**

Use an environment variable via Vite: `import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'`.

**Resolution:** Updated `frontend/src/api/client.ts` to use `import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'`.

---

## Issue 34 — `Navbar` Component Uses `any` Type for User Prop ✅ Completed

**Severity:** Low

**File**

`frontend/src/components/Navbar.tsx`

**Lines**

3

**Problem**

`{ user: any }` provides no type safety. All pages also use `useState<any>(null)` for user state.

**Impact**

No TypeScript benefits for user-related code; potential runtime errors from accessing non-existent properties.

**Suggested Fix**

Define a `User` interface matching the API response and use it throughout.

**Resolution:** Defined `User` in `frontend/src/types/user.ts` and updated `Navbar.tsx` and all page components (Dashboard, Books, BorrowHistory, AdminDashboard) to use `User | null` instead of `any`.

---

## Issue 35 — `index.html` Title is "frontend" Instead of "LibOps" ✅ Completed

**Severity:** Low

**File**

`frontend/index.html`

**Lines**

7

**Problem**

The page title is the default Vite template value "frontend".

**Impact**

Poor UX; unprofessional appearance in browser tabs.

**Suggested Fix**

Change to `<title>LibOps - Library Management System</title>`.

---

## Issue 36 — `README.md` is Empty ✅ Completed

**Severity:** Low

**File**

`README.md`

**Lines**

1

**Problem**

The project README is completely empty.

**Impact**

New developers have no onboarding documentation; the project appears unmaintained on GitHub.

**Suggested Fix**

Add project description, setup instructions, architecture overview, and contribution guidelines.

**Resolution:** Created a basic `README.md` with project setup instructions.

---

## Issue 37 — Inline `import uuid` and `from app.models.enums import UserRole` in `deps.py` ✅ Completed

**Severity:** Low

**File**

`backend/app/api/deps.py`

**Lines**

37, 59

**Problem**

`import uuid` is placed inline inside `get_current_user()`, and `from app.models.enums import UserRole` is inline inside `get_current_active_admin()`. These should be module-level imports per PEP 8.

**Impact**

Reduced readability; violates Python conventions.

**Suggested Fix**

Move both imports to the top of the file.

**Resolution:** Moved inline imports to the top of `backend/app/api/deps.py`.

---

## Issue 38 — `BookResponse` Includes Redundant `available_quantity` Property ✅ Completed

**Severity:** Low

**File**

- `backend/app/schemas/book.py`, line 35
- `backend/app/models/books.py`, lines 36–38

**Problem**

`BookResponse` includes both `available_copies` (from `BookBase`) and `available_quantity` (a property on the model that just returns `available_copies`). This returns the same value twice under different names.

**Impact**

Confusing API; redundant data in responses.

**Suggested Fix**

Remove either `available_copies` from `BookBase` or `available_quantity` from `BookResponse`, and remove the redundant property from the model.

**Resolution:** Removed `available_quantity` from the `Book` model (`models/books.py`) and from the `BookResponse` schema (`schemas/book.py`).

---

## Issue 39 — `create_user` Returns 200 Instead of 201 ✅ Completed

**Severity:** Low

**File**

`backend/app/api/endpoints/users.py`

**Lines**

15

**Problem**

`POST /api/v1/users/` returns the default 200 status code. Per HTTP semantics, resource creation should return 201 Created (as correctly done for `POST /api/v1/books/`).

**Impact**

Inconsistent API behavior; non-standard response codes.

**Suggested Fix**

Add `status_code=status.HTTP_201_CREATED` to the `@router.post` decorator.

**Resolution:** Added `status_code=status.HTTP_201_CREATED` to the `create_user` route decorator in `backend/app/api/endpoints/users.py`.

---

## Issue 40 — `docker-compose.yml` Uses Deprecated `version` Key ✅ Completed

**Severity:** Low

**File**

- `docker-compose.yml`, line 1
- `docker-compose.prod.yml`, line 1

**Problem**

`version: '3.8'` is deprecated in Docker Compose V2. The `version` field is now ignored and should be removed.

**Impact**

Deprecation warning when running `docker compose up`.

**Suggested Fix**

Remove the `version: '3.8'` line from both files.

**Resolution:** Removed the deprecated `version: '3.8'` line from `docker-compose.yml` and `docker-compose.prod.yml`.

---

## Issue 41 — No Terraform Remote State Backend Configured ❌ Blocked

**Severity:** Low

**File**

`terraform/main.tf`

**Lines**

5–12

**Problem**

Terraform uses the default local backend. The `terraform.tfstate` and `terraform.tfstate.backup` files are in the repo (though gitignored). Without a remote backend (S3, Terraform Cloud), state is not shared across team members and risks being lost.

**Impact**

Infrastructure state is only on one developer's machine; no locking; risk of concurrent modifications.

**Suggested Fix**

Configure an S3 backend with DynamoDB locking inside the `terraform` block.

**Resolution:** Blocked. Adding an S3 remote backend requires provisioning the S3 bucket and DynamoDB table first. Attempting to add the configuration block without those resources existing would break `terraform init`.

---

## Issue 42 — `storage_service` Module-Level Instantiation Silently Falls Back ✅ Completed

**Severity:** Low

**File**

`backend/app/utils/storage.py`

**Lines**

57

**Problem**

`storage_service = StorageService()` runs at import time. The constructor calls `boto3.client("s3")` which may raise if AWS credentials are partially configured or boto3 encounters an error. The `except Exception` on line 22 catches this, but sets `self.s3 = None`, which then silently falls through to local storage — potentially surprising behavior in production.

**Impact**

Silent fallback to local storage in production if AWS config is even slightly wrong (e.g., region misconfigured). No error surfaced to the operator.

**Suggested Fix**

Log a warning at `WARNING` level (not just catch and set `None`) so operators are aware S3 is not in use.

**Resolution:** Added standard `logging` and a `logger.warning` to log failure in `backend/app/utils/storage.py` instead of silently setting `self.s3 = None`.

---

# Improvements

1. **Add request rate limiting**: No rate limiting exists on any endpoint — the login endpoint is especially vulnerable to brute-force attacks. Consider `slowapi` or nginx-level rate limiting.

2. **Add pagination metadata**: List endpoints return raw arrays with no `total`, `page`, `has_more` metadata. Add response wrappers for proper pagination.

3. **Add structured logging**: The current logging uses f-strings. Switch to structured JSON logging for better observability in CloudWatch.

4. **Add health check with DB ping**: The `/health` endpoint returns a static response without checking DB connectivity.

5. **Add token refresh/rotation**: Only access tokens exist. Add refresh tokens for better security.

6. **Add frontend error boundaries**: No React error boundaries exist. Unhandled errors crash the entire app.

7. **Add CSRF protection**: While token-based auth mitigates CSRF for API calls, the login form uses `application/x-www-form-urlencoded` which is CSRF-vulnerable.

8. **Add OpenAPI metadata**: The `FastAPI()` constructor has no `title`, `description`, `version` parameters. The auto-generated docs are unnamed.

9. **Add `alembic/env.py` model imports**: The `env.py` imports `Base` but does not import models. Autogenerate will miss model changes unless models are imported elsewhere first. Currently this works because `main.py` imports `app.models`, but `env.py` should be self-contained.

10. **Add frontend build-time type checking**: The `package.json` build script runs `tsc -b` but there are likely type errors due to heavy use of `any`.

11. **Add `Depends` annotations**: Functions like `get_db` could use `Annotated[Session, Depends(get_db)]` for cleaner dependency injection (FastAPI best practice).

12. **Dockerfiles should pin exact versions**: `python:3.12-slim` and `node:20-alpine` will drift over time. Consider pinning digests or specific patch versions.

---

# Technical Debt

1. **CRUD module is not a class hierarchy**: The CRUD layer uses standalone functions per model instead of a reusable base class. This leads to duplicated `get`, `get_multi`, `create`, `update`, `remove` patterns across `crud_book.py`, `crud_user.py`, and `crud_borrow.py`. Consider a `CRUDBase[ModelType, CreateSchemaType, UpdateSchemaType]` generic class.

2. **No service layer**: Business logic (e.g., borrowing a book) is in the CRUD layer, which raises `HTTPException` — coupling data access to HTTP concerns. A service layer would improve testability and separation of concerns.

3. **Frontend has no state management**: All state is local to each page component. User data is fetched independently on every page (`/users/me` is called on Dashboard, Books, BorrowHistory, AdminDashboard). Consider React Context, Zustand, or similar.

4. **Frontend has no TypeScript types**: Heavy use of `any` throughout. Define proper interfaces for API responses.

5. **No database indexes on borrow_records**: `borrow_records` is queried by `user_id` and `book_id` + `status` frequently but has no indexes beyond the primary key and foreign keys.

6. **No API versioning strategy**: While routes use `/api/v1/`, there's no mechanism for v2 coexistence.

7. **Terraform has no staging/dev environment separation**: All resources are named `libops-*` with no environment prefix. There's no way to create parallel environments.

8. **Jenkins pipeline has no test stage for frontend**: Only backend quality checks run; no `npm test` or `npm run lint` for the frontend.

9. **No `.dockerignore` files**: Both `backend/` and `frontend/` directories lack `.dockerignore`, causing unnecessary files (`.venv`, `node_modules`, `.git`, `test.db`) to be included in the Docker build context, slowing builds.

---

# Ready for Next Phase?

**No**

**Reason:**

The project has 5 critical issues that must be resolved before continuing development:

1. **Privilege escalation via open registration** (any user can register as admin) — this makes the entire authorization system useless.
2. **Hardcoded secret key in version-controlled `docker-compose.yml`** — all JWTs can be forged.
3. **`updated_at` field never updates** — core audit infrastructure is silently broken.
4. **Frontend borrow history page is completely non-functional** — wrong endpoint and wrong field names.
5. **`bcrypt` dependency may not be installed** — authentication could break on clean install.

These issues collectively mean the application is insecure, partially non-functional, and has an unreliable data model. All 5 critical and the 11 high-severity issues should be addressed before further feature development.
