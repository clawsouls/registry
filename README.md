# SoulClaw Registry

The open registry for AI agent personas built with [Soul Spec](https://soulspec.org).

**Browse, submit, and install verified personas — every submission is automatically scanned by [SoulScan](https://clawsouls.ai/soulscan) for safety.**

[![Personas](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fclawsouls%2Fregistry%2Fmain%2Findex.json&query=%24.total&label=personas&color=purple)](https://clawsouls.ai)
[![SoulScan](https://img.shields.io/badge/SoulScan-53%20patterns-brightgreen)](https://clawsouls.ai/soulscan)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Browse Personas

Visit **[clawsouls.ai/souls](https://clawsouls.ai/souls)** or browse the [`souls/`](./souls) directory.

## Submit a Persona

1. **Fork** this repository
2. Create `souls/<your-github-username>/<persona-name>/`
3. Add required files:
   - `soul.json` — metadata (name, version, description, category)
   - `SOUL.md` — personality & principles
4. Add optional files:
   - `IDENTITY.md` — name, role, traits
   - `STYLE.md` — communication tone
   - `AGENTS.md` — workflow rules
   - `README.md` — description for the registry
5. **Open a Pull Request**
6. CI automatically runs **SoulScan** (53-pattern safety verification)
7. If SoulScan passes (grade C or above), your PR is eligible for merge

### Minimum `soul.json`

```json
{
  "name": "my-agent",
  "displayName": "My Agent",
  "version": "1.0.0",
  "description": "A helpful coding assistant",
  "category": "developer-tools",
  "author": "your-github-username",
  "license": "MIT"
}
```

### Categories

| Category | Description |
|----------|-------------|
| `developer-tools` | Coding assistants, reviewers, architects |
| `productivity` | Task management, writing, research |
| `creative` | Writing, art direction, storytelling |
| `compliance` | Legal, regulatory, audit |
| `education` | Teaching, tutoring, mentoring |
| `devops` | Infrastructure, CI/CD, monitoring |
| `data` | Analytics, ML, data engineering |
| `security` | Security analysis, penetration testing |
| `general` | General-purpose assistants |

### Directory Structure

```
souls/
├── TomLeeLive/
│   ├── brad/
│   │   ├── soul.json
│   │   ├── SOUL.md
│   │   ├── IDENTITY.md
│   │   ├── AGENTS.md
│   │   └── README.md
│   └── surgical-coder/
│       ├── soul.json
│       └── SOUL.md
├── community/
│   └── debug-detective/
│       ├── soul.json
│       └── SOUL.md
└── ...
```

## SoulScan CI

Every PR is automatically scanned by SoulScan — 53 safety patterns including:

- ❌ Prompt injection detection
- ❌ Permission escalation
- ❌ Safety boundary violations
- ❌ Harmful instruction detection
- ❌ Identity consistency issues

The scan result is posted as a PR comment:

```
🔍 SoulScan Results: A- (48/53)
✅ Safe to merge

Issues:
🔵 missing-style: No STYLE.md found (optional but recommended)
```

**Grade requirements:**
- **A+ to C**: ✅ Eligible for merge
- **D or F**: ❌ Must fix issues before merge

## Install a Persona

### Via Claude Code Plugin
```bash
/plugin marketplace add https://github.com/clawsouls/clawsouls-claude-code-plugin
/plugin install clawsouls
/clawsouls:browse
```

### Via CLI
```bash
npm install -g clawsouls
clawsouls install TomLeeLive/brad
```

### Via MCP
```bash
npx -y clawsouls-mcp@latest
# → soul_search, soul_install tools available
```

## Links

- [ClawSouls Platform](https://clawsouls.ai)
- [Soul Spec Standard](https://soulspec.org)
- [Claude Code Plugin](https://github.com/clawsouls/clawsouls-claude-code-plugin)
- [MCP Server](https://www.npmjs.com/package/clawsouls-mcp)
- [Documentation](https://docs.clawsouls.ai)

## License

MIT — personas in `souls/` are licensed individually (see each persona's `soul.json`).
