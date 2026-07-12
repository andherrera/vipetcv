---
name: write-tests
description: "Write unit and integration tests for existing code following tests_v2 patterns. Unit tests use mocked dependencies for domain logic. Integration tests use real database for API endpoints. Use when user mentions 'test this', 'add tests', 'test coverage', 'write tests', 'unit test', 'integration test', or needs retroactive testing for functions or endpoints."
---

# Write Tests

Write unit and integration tests for existing code following tests_v2 patterns and company standards.

## Workflow

1. **Examine the code to test:**
   - Is it a domain function/class? → Write unit tests
   - Is it an API endpoint/route? → Write integration tests
   - Not sure? Ask user: "Should I write unit tests (isolated with mocks) or integration tests (with real DB)?"

2. **Read project standards:** See `../../references/testing-standards.md`

3. **Follow tests_v2 patterns:**
   - Use fixtures: `common_session`, `tenant_session`, `system_admin`
   - Import factories: `from tests_v2.utils.factories.{domain}_factories import {entity}_factory`
   - Module-level markers: `pytestmark = [pytest.mark.{unit|integration}, pytest.mark.anyio]`
   - Naming: `test_<unit>_<scenario>_<outcome>`

4. **For unit tests:**
   - Location: `tests_v2/unit/domain/services/test_<module>.py`
   - Mock external boundaries (repos, APIs, file systems)
   - Keep domain logic real

5. **For integration tests:**
   - Location: `tests_v2/integration/<domain>/test_<module>.py`
   - Use real database sessions (automatic rollback)
   - Use `authenticated_client` fixture for API testing
   - Mock only external systems (S3, external APIs)

6. **Verify tests pass:**
   ```bash
   pytest tests_v2/integration/  # or tests_v2/unit/
   ```

7. **Check coverage:**
   ```bash
   pytest tests_v2/ --cov=app --cov-report=html
   ```

## Examples & Documentation

**Real working examples:**
- Integration tests: `tests_v2/integration/clients/test_client.py`
- Factory usage: `tests_v2/docs/README.md` (lines 156-184)
- Architecture patterns: `tests_v2/docs/ARCHITECTURE.md`

**Project standards:** `../../references/testing-standards.md`

## Gotchas

- Tests MUST be in `tests_v2/` directory (not old `tests/`)
- Use `pytest.mark.anyio` (not `pytest.mark.asyncio`)
- Factories are in separate files by domain: `tests_v2/utils/factories/{domain}_factories.py`
- Integration tests use `authenticated_client`, not `test_client` (auth is pre-configured)
- Transaction rollback is automatic - no manual cleanup needed

## Coverage Requirements

- Minimum: 80% (CI enforced)
- Generate evidence: `pytest tests_v2/ --cov=app --cov-branch --cov-report=html`
- Attach coverage report to Jira ticket
