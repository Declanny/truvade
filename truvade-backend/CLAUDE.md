# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure & Module Organization

- **Core project:** `core/`
  - `settings.py` — Django settings (single file, SQLite for dev)
  - URLs, WSGI/ASGI entrypoints

- **App modules:** e.g., `accounts/`, `shortlet/`, (future: `bookings/`, `payments/`, `messaging/`, `reviews/`, `wishlists/`)
  - `models.py` — ORM definitions
  - `domain/` — business logic split into:
    - `services.py` — write side (create/update flows wrapped in transactions)
    - `selectors.py` — read side (optimized queryset helpers with `select_related`, `prefetch_related`)
  - `api/v1/` — DRF-only transport layer:
    - `serializers.py` — separate read vs write serializers
    - `views.py` — thin; delegate to services/selectors
    - `permissions.py`, `filters.py`, `validators.py`, `schemas.py`
    - `urls.py`
    - `signals.py`, `tasks.py` if needed
  - `tests/` — pytest tests
  - **Versioning:** group endpoints under `api/v1/` to allow `api/v2/` later
- **Entry point:** `manage.py`
- **Environment:** `.env` (loaded via `python-dotenv`) when configured

## Domain

Truvade is a verified shortlet booking platform for Africa (Nigeria focus). The frontend lives in `../truvade-web/` (Next.js, currently all mock data).

**User roles**: GUEST, HOST, OWNER, ADMIN

**Key domain areas**: Properties, Bookings, Payments (Stripe), KYC Verification (BVN/NIN + document upload), Messaging, Organizations, Host Invitations/Memberships, Reviews, Wishlists

**Revenue model**: Platform fee (8%) on bookings, commission-based payouts to hosts/owners.

## Build, Test, and Development Commands

### Install (using uv)

```bash
# Sync dependencies from pyproject.toml
uv sync

# Activate the virtual environment
source .venv/bin/activate
```

### Adding/Removing Dependencies

```bash
# Add a new dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Remove a dependency
uv remove package-name

# Update all dependencies
uv lock --upgrade
```

### Run (dev)

```bash
uv run python manage.py migrate && uv run python manage.py runserver
```

### Tests

```bash
# Run all tests
uv run pytest -q

# Run specific app tests
uv run pytest shortlet/tests/ -q

# Run single test file
uv run pytest shortlet/tests/test_models.py -q

# Run with verbose output
uv run pytest -v
```

## Migrations

- **Never hand-write Django migration files.**
- When you change models, run `uv run python manage.py makemigrations` to generate migrations.
- Apply them locally with `uv run python manage.py migrate` and include the generated migration files in your commits.
- If migrations conflict, regenerate as needed (re-run `makemigrations`) or resolve by creating a new migration that depends on both.
- Periodically verify no pending model changes with `uv run python manage.py makemigrations --check --dry-run`.

## Coding Style & Naming Conventions

- Python 3.14+ / Django 6.0.3+; follow PEP 8 (4-space indentation, ~88–100 char lines)
- Modules: `snake_case.py`; classes: `PascalCase`; functions/vars: `snake_case`
- Django/DRF pattern:
  - Keep views thin (routing, request/response handling only)
  - Place business logic in `domain/services.py`
  - Place querying/filters in `domain/selectors.py`
  - Keep serializers focused on I/O and validation
- URLs: define per app (e.g., `shortlet/api/v1/urls.py`) and include in `core/urls.py`

## Formatting & Linting

- Run format + lint before commit using **Ruff** (fast, all-in-one Python linter and formatter)
- Format code: `uv run ruff format .`
- Lint code: `uv run ruff check .`
- Auto-fix issues: `uv run ruff check --fix .`
- Configuration in `pyproject.toml`
- Keep diffs minimal; avoid unrelated reformatting

## Testing Guidelines

- **Framework:** `pytest` + `pytest-django`
  - **TDD policy:** For every new implementation or change, write or update the relevant tests first. Do not merge features without accompanying tests.
- **Location:** `app/tests/` preferred (`test_*.py`)
- **Conventions:**
  - One assert per behavior
  - Test models, services, selectors, and API endpoints
  - Use factories/helpers for setup (model-bakery available)
  - Run fast, isolated tests; seed via fixtures only when needed
- **Test layering:**
  - Unit tests for selectors (query correctness)
  - Transactional tests for services (business rules)
  - API tests for endpoint behavior across roles (Guest/Host/Owner/Admin)

### Pytest specifics

- Use `@pytest.mark.django_db` for tests touching the database
- Prefer functional tests with `rest_framework.test.APIClient` via the `api_client` fixture (see `conftest.py`)
- Keep tests under app-scoped `tests/` packages, named `test_*.py`
- **Recommended TDD loop:** write/adjust tests -> run tests (watch them fail) -> implement/change code -> run tests (watch them pass) -> refactor

### Test Fixtures (conftest.py)

Key fixtures available in `shortlet/tests/conftest.py`:
- `api_client` — DRF APIClient instance
- `owner`, `other_owner`, `guest` — User fixtures with roles
- `property_data` — Dictionary of property creation data
- `draft_property` — Pre-created draft property
- `publishable_property` — Property with 5+ images ready to publish

## Commit & Pull Request Guidelines

- **Commits:** imperative, (<=72 chars). Example:
  - `Add SubCategory model and admin tweaks`
- Reference scope in body when relevant (migrations, settings, CI)
- **PRs:**
  - Clear description, linked issues
  - List changes; include screenshots for admin/UI
  - Note env/migration impacts
  - Ensure tests for changed behavior
  - Keep diffs focused

## Security & Configuration Tips

- Do not commit secrets
- Configure via `.env` and production env vars
- **Key env vars:** `SECRET_KEY`, `DEBUG`, DB vars, CORS/CSRF
- **Package manager:** `uv` (not pip). Dependencies in `pyproject.toml`, locked in `uv.lock`

## Architecture Overview

- **Stack:** Django 6.0.3+ / DRF API, Python 3.14+
- **Database:** SQLite for development
- **Layered architecture:** serializers -> views -> services/selectors
- **Permissions:** centralized in `permissions.py`
- **Filters/ordering/pagination:** standardized via `django-filter`
- **Schema/docs:** `drf-spectacular` for OpenAPI
  - Swagger UI: `/api/docs/`
  - ReDoc: `/api/redoc/`
  - Schema: `/api/schema/`
- **Performance best practices:**
  - Always use `select_related`/`prefetch_related` in selectors
  - Add DB indexes on frequently filtered fields
  - Use `only()`/`defer()` in list endpoints
  - Wrap multi-write flows in `@transaction.atomic`

## Key Architecture Patterns

### Service Layer (Write Operations)

All create/update/delete logic goes in `domain/services.py`:

```python
from django.db import transaction

@transaction.atomic
def create_property(*, owner, name, **kwargs):
    """Create a new property listing."""
    property = Property.objects.create(
        owner=owner,
        name=name,
        **kwargs
    )
    # Additional related object creation...
    return property
```

### Selector Layer (Read Operations)

All query logic goes in `domain/selectors.py`:

```python
def get_properties_for_owner(owner_id):
    """Fetch properties with optimized related data."""
    return Property.objects.filter(
        owner_id=owner_id
    ).select_related(
        "owner",
    ).prefetch_related(
        "images",
    )
```

### View Layer (HTTP Transport)

Views in `api/v1/views.py` stay thin and delegate:

```python
from rest_framework.views import APIView
from rest_framework.response import Response

class PropertyListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        properties = get_properties_for_owner(request.user.id)
        serializer = PropertyReadSerializer(properties, many=True)
        return Response({"data": serializer.data})
```

## User Roles & Authentication

- **Custom user model:** `accounts.User` (email-based login)
- **Roles:**
  - `GUEST` — Browse and book properties
  - `HOST` — Manage property listings on behalf of owners
  - `OWNER` — Property owners, manage their portfolio
  - `ADMIN` — Platform administration

## Common Workflows

### Adding a New Feature

1. **Write test first** (TDD):
   ```python
   @pytest.mark.django_db
   def test_feature_works(api_client):
       # Test implementation
   ```

2. **Add service** in `domain/services.py`:
   ```python
   @transaction.atomic
   def perform_action(...):
       # Business logic
   ```

3. **Add selector** in `domain/selectors.py` if needed:
   ```python
   def get_data_for_action(...):
       return Model.objects.filter(...).select_related(...)
   ```

4. **Add serializers** in `api/v1/serializers.py`:
   - Separate read vs write serializers when needed

5. **Add view** in `api/v1/views.py`:
   - Keep thin, delegate to services/selectors

6. **Add URL** in `api/v1/urls.py`

7. **Run tests:**
   ```bash
   uv run pytest app/tests/test_feature.py -v
   ```

8. **Format and lint:**
   ```bash
   uv run ruff format . && uv run ruff check .
   ```

### Handling Migrations

When models change:
```bash
# Generate migrations
uv run python manage.py makemigrations

# Review generated files in app/migrations/

# Apply locally
uv run python manage.py migrate

# Commit migration files with code changes
```

## Troubleshooting

- **Import errors:** Ensure virtualenv is activated (`source .venv/bin/activate`)
- **Migration conflicts:** Run `uv run python manage.py makemigrations --merge` or regenerate
- **Test failures:** Ensure clean test DB; pytest isolates in transactions by default
