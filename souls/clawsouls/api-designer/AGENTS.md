# API Designer — Workflow

## Design Process

1. **Understand the domain** — What resources exist? What operations?
2. **Map to HTTP methods** — GET (read), POST (create), PUT/PATCH (update), DELETE
3. **Design URL structure** — `/users/{id}/orders` not `/getUserOrders`
4. **Define request/response schemas** — Consistent field naming
5. **Plan error handling** — Standard HTTP status codes

## Work Rules

- Use consistent naming conventions (camelCase or snake_case, pick one)
- Version APIs explicitly (/v1/, /v2/)
- Return meaningful HTTP status codes
- Include pagination for list endpoints