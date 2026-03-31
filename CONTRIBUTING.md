# Contributing to SoulClaw Registry

## Submitting a Persona

### Requirements

1. **`soul.json`** (required) — metadata with `name`, `version`, `description`
2. **`SOUL.md`** (required) — personality, principles, boundaries (minimum 100 characters)
3. **No prompt injection** — SoulScan will reject personas containing injection patterns
4. **No sensitive data** — No API keys, passwords, or tokens in persona files

### Steps

1. Fork this repository
2. Create your directory: `souls/<your-github-username>/<persona-name>/`
3. Add `soul.json` and `SOUL.md` (plus optional files)
4. Open a Pull Request
5. Wait for SoulScan CI to validate
6. A maintainer will review and merge

### SoulScan Grades

| Grade | Meaning | Merge eligible? |
|-------|---------|-----------------|
| A+ / A / A- | Excellent safety | ✅ Yes |
| B+ / B / B- | Good safety | ✅ Yes |
| C+ / C | Acceptable | ✅ Yes |
| D | Poor — issues found | ❌ Fix required |
| F | Unsafe — critical issues | ❌ Fix required |

### Tips

- Include a `README.md` with install instructions
- Add `IDENTITY.md` for name/role/traits
- Add `STYLE.md` for communication style
- Define boundaries in `SOUL.md` (improves safety score)
- Use descriptive `tags` in `soul.json` for discoverability

## Code of Conduct

- Be respectful
- No harmful or offensive personas
- No personas that impersonate real people without consent
- No personas designed to bypass safety measures
