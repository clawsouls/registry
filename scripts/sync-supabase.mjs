#!/usr/bin/env node

/**
 * sync-supabase.mjs
 * 
 * Syncs registry index.json → Supabase (souls + users + versions tables)
 * 
 * Flow:
 *   1. Read index.json
 *   2. For each soul:
 *      a. Resolve author GitHub ID via GitHub API
 *      b. Upsert user (github_id as key)
 *      c. Check existing soul in DB
 *         - Not exists → INSERT
 *         - Exists + higher version → UPDATE
 *         - Exists + same/lower version → SKIP
 *      d. Upsert version record
 *   3. Read file contents from souls/ directory
 * 
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 * 
 * Optional env:
 *   GITHUB_TOKEN (for higher rate limits)
 *   DRY_RUN=true (log only, no writes)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const DRY_RUN = process.env.DRY_RUN === 'true';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// --- Supabase REST helpers ---

async function supabaseGet(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabaseUpsert(table, data, onConflict) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] UPSERT ${table}:`, JSON.stringify(data).slice(0, 200));
    return data;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`UPSERT ${table}: ${res.status} ${body}`);
  }
  return res.json();
}

async function supabaseUpdate(table, match, data) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] UPDATE ${table} where ${match}:`, JSON.stringify(data).slice(0, 200));
    return data;
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`UPDATE ${table}: ${res.status} ${body}`);
  }
  return res.json();
}

// --- GitHub API helper ---

const ghCache = new Map();

async function getGitHubUser(username) {
  if (ghCache.has(username)) return ghCache.get(username);

  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!res.ok) {
    console.warn(`  ⚠️ GitHub user "${username}" not found (${res.status})`);
    return null;
  }
  const data = await res.json();
  const user = {
    github_id: data.id,
    username: data.login,
    display_name: data.name || data.login,
    avatar_url: data.avatar_url,
  };
  ghCache.set(username, user);
  return user;
}

// --- Version comparison ---

function parseVersion(v) {
  const parts = (v || '0.0.0').split('.').map(Number);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

function isHigherVersion(newVer, oldVer) {
  const a = parseVersion(newVer);
  const b = parseVersion(oldVer);
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}

// --- File content reader ---

function readSoulFiles(soulPath) {
  const files = {};
  const fileContents = {};

  const fileMap = {
    'soul.json': 'soul_json',
    'SOUL.md': 'soul',
    'IDENTITY.md': 'identity',
    'STYLE.md': 'style',
    'AGENTS.md': 'agents',
    'HEARTBEAT.md': 'heartbeat',
    'README.md': 'readme',
    'RULES.md': 'rules',
  };

  for (const [filename, key] of Object.entries(fileMap)) {
    const filepath = join(soulPath, filename);
    if (existsSync(filepath)) {
      files[key] = filename;
      try {
        fileContents[key] = readFileSync(filepath, 'utf-8');
      } catch (e) {
        console.warn(`  ⚠️ Could not read ${filepath}: ${e.message}`);
      }
    }
  }

  return { files, fileContents };
}

// --- Main sync ---

async function main() {
  console.log('🔄 Syncing registry to Supabase...');
  if (DRY_RUN) console.log('  [DRY RUN MODE]');

  // Read index.json
  const indexPath = join(process.cwd(), 'index.json');
  if (!existsSync(indexPath)) {
    console.error('❌ index.json not found');
    process.exit(1);
  }
  const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  console.log(`  Found ${index.total} souls in index.json`);

  let synced = 0, skipped = 0, errors = 0;

  for (const soul of index.souls) {
    const label = `${soul.owner}/${soul.name}`;
    console.log(`\n--- ${label} ---`);

    try {
      // 1. Resolve GitHub user
      const rawAuthor = soul.author;
      const ghUsername = typeof rawAuthor === 'object' ? (rawAuthor.github || rawAuthor.name) : (rawAuthor || soul.owner);
      const ghUser = await getGitHubUser(ghUsername);

      let authorId = null;

      if (ghUser) {
        // Upsert user
        const [existingUser] = await supabaseGet('users', `github_id=eq.${ghUser.github_id}&select=id`);

        if (existingUser) {
          authorId = existingUser.id;
          console.log(`  ✅ User exists: ${ghUser.username} (${authorId})`);
        } else {
          const [newUser] = await supabaseUpsert('users', {
            github_id: ghUser.github_id,
            username: ghUser.username,
            display_name: ghUser.display_name,
            avatar_url: ghUser.avatar_url,
          }, 'github_id');
          authorId = newUser?.id;
          console.log(`  ✅ User created: ${ghUser.username} (${authorId})`);
        }
      }

      if (!authorId) {
        console.warn(`  ⚠️ No author_id for ${label} — skipping`);
        skipped++;
        continue;
      }

      // 2. Check existing soul (global name uniqueness)
      const existingGlobal = await supabaseGet('souls',
        `name=eq.${encodeURIComponent(soul.name)}&select=id,latest_version,owner_name`
      );

      // If soul name exists under a different owner, skip (platform enforces global uniqueness)
      if (existingGlobal.length > 0 && existingGlobal[0].owner_name !== soul.owner) {
        console.log(`  ⚠️ SKIP — name "${soul.name}" already exists under ${existingGlobal[0].owner_name} (global uniqueness)`);
        skipped++;
        continue;
      }

      const existing = existingGlobal;

      const soulPath = join(process.cwd(), soul.path);
      const { files, fileContents } = readSoulFiles(soulPath);

      if (existing.length > 0) {
        const dbSoul = existing[0];

        // Version check
        if (!isHigherVersion(soul.version, dbSoul.latest_version)) {
          console.log(`  ⏭️ SKIP — DB has v${dbSoul.latest_version}, registry has v${soul.version}`);
          skipped++;
          continue;
        }

        // Update soul
        await supabaseUpdate('souls', `id=eq.${dbSoul.id}`, {
          display_name: soul.displayName,
          description: soul.description,
          category: soul.category,
          license: soul.license || 'MIT',
          tags: soul.tags || [],
          latest_version: soul.version,
          updated_at: new Date().toISOString(),
        });

        // Insert new version
        await supabaseUpsert('versions', {
          soul_id: dbSoul.id,
          version: soul.version,
          files: files,
          file_contents: fileContents,
        }, 'soul_id,version');

        console.log(`  ✅ UPDATED v${dbSoul.latest_version} → v${soul.version}`);
        synced++;

      } else {
        // Insert new soul
        const [newSoul] = await supabaseUpsert('souls', {
          name: soul.name,
          owner_name: soul.owner,
          display_name: soul.displayName,
          description: soul.description,
          category: soul.category,
          license: soul.license || 'MIT',
          tags: soul.tags || [],
          author_id: authorId,
          latest_version: soul.version,
          status: 'active',
        }, 'owner_name,name');

        if (newSoul?.id) {
          // Insert version
          await supabaseUpsert('versions', {
            soul_id: newSoul.id,
            version: soul.version,
            files: files,
            file_contents: fileContents,
          }, 'soul_id,version');
        }

        console.log(`  ✅ INSERTED (new soul)`);
        synced++;
      }

    } catch (err) {
      console.error(`  ❌ ERROR: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n🔄 Sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`);

  if (errors > 0) process.exit(1);
}

main();
