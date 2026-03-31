#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SOULS_DIR = 'souls';
const OUTPUT = 'index.json';

function buildIndex() {
  const souls = [];
  const categories = new Set();
  const contributors = new Set();

  if (!existsSync(SOULS_DIR)) {
    console.log('No souls/ directory found');
    writeFileSync(OUTPUT, JSON.stringify({ total: 0, souls: [], categories: [], contributors: [], generatedAt: new Date().toISOString() }, null, 2));
    return;
  }

  for (const owner of readdirSync(SOULS_DIR, { withFileTypes: true })) {
    if (!owner.isDirectory()) continue;
    const ownerPath = join(SOULS_DIR, owner.name);

    for (const soul of readdirSync(ownerPath, { withFileTypes: true })) {
      if (!soul.isDirectory()) continue;
      const soulPath = join(ownerPath, soul.name);
      const jsonPath = join(soulPath, 'soul.json');

      if (!existsSync(jsonPath)) continue;

      try {
        const manifest = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        const hasSoul = existsSync(join(soulPath, 'SOUL.md'));
        const hasIdentity = existsSync(join(soulPath, 'IDENTITY.md'));
        const hasStyle = existsSync(join(soulPath, 'STYLE.md'));
        const hasAgents = existsSync(join(soulPath, 'AGENTS.md'));
        const hasReadme = existsSync(join(soulPath, 'README.md'));

        const entry = {
          owner: owner.name,
          name: manifest.name || soul.name,
          displayName: manifest.displayName || manifest.name || soul.name,
          version: manifest.version || '1.0.0',
          description: manifest.description || '',
          category: manifest.category || 'general',
          author: manifest.author || owner.name,
          license: manifest.license || 'MIT',
          tags: manifest.tags || [],
          files: {
            'soul.json': true,
            'SOUL.md': hasSoul,
            'IDENTITY.md': hasIdentity,
            'STYLE.md': hasStyle,
            'AGENTS.md': hasAgents,
            'README.md': hasReadme,
          },
          path: `souls/${owner.name}/${soul.name}`,
        };

        souls.push(entry);
        if (manifest.category) categories.add(manifest.category);
        contributors.add(owner.name);
      } catch (e) {
        console.error(`Error parsing ${jsonPath}:`, e.message);
      }
    }
  }

  const index = {
    total: souls.length,
    categories: [...categories].sort(),
    contributors: [...contributors].sort(),
    generatedAt: new Date().toISOString(),
    souls: souls.sort((a, b) => a.displayName.localeCompare(b.displayName)),
  };

  writeFileSync(OUTPUT, JSON.stringify(index, null, 2));
  console.log(`Generated ${OUTPUT}: ${souls.length} souls, ${categories.size} categories, ${contributors.size} contributors`);
}

buildIndex();
