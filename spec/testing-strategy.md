## ✅ Testing Strategy

### 🔹 Unit Tests

- Found in `/tests/unit` or `/packages/*/tests/unit`
- Focus on domain logic (e.g., annotation creation constraints)

### 🔹 Integration Tests

- Use real repositories or mocked infrastructure
- Validate full use-case execution paths

### 🔹 End-to-End Tests

- Simulate user flows (e.g., create annotation via extension)
- Run against deployed/test environments

### 🔹 Mocking + Fixtures

- Keep shared test helpers under `/tests/mocks/` and `/tests/setup/`

---
