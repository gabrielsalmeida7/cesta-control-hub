import fs from 'fs';

const path = 'c:/Users/Gabriel S. Almeida/Downloads/adresses-csv.csv';

function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lista referência LC 215/2023 + variações comuns (consolidada para matching)
const OFFICIAL = [
  ['Aeroporto', ['aeroporto']],
  ['Alam Cardec', ['alam cardec', 'alan kardec', 'kardec']],
  ['Amorim', ['amorim']],
  ['Antigo Canaã', ['antigo canaa', 'antigo cana']],
  ['Beatriz', ['beatriz']],
  ['Bela Suíça', ['bela suica', 'bela suica 2', 'bela suica 3', 'bela suica ii', 'bela suica iii', 'bela suiça 2', 'bela suiça 3']],
  ['Bosque', ['bosque']],
  ['Brasília', ['brasilia', 'b brasilia', 'matinha']],
  ['Centro', ['centro']],
  ['Cidade Jardim', ['cidade jardim']],
  ['Cidade Nova', ['cidade nova']],
  ['Flamboyant', ['flamboyant', 'flaboyante', 'flamboyants']],
  ['Goianases', ['goianases']],
  ['Goiás', ['goias', 'goiás']],
  ['Gran Ville', ['gran ville', 'granville']],
  ['Gutierrez', ['gutierrez']],
  ['Industrial', ['industrial']],
  ['Independência', ['independencia', 'independência']],
  ['Ipê', ['ipe', 'ipe 1', 'ipe 2', 'ipe1', 'ipe2', 'portal dos ipes', 'poral dos ipes']],
  ['João Calixto', ['joao calixto']],
  ['Jardim Ipanema', ['jardim ipanema']],
  ['Jardim Regina', ['jardim regina']],
  ['Joquei Clube', ['joquei clube', 'jokei clube']],
  ['Madri', ['madri', 'madrid']],
  ['Maria Eugênia', ['maria eugenia', 'maria eugênia']],
  ['Milenium', ['milenium', 'milennium', 'milenio']],
  ['Miranda', ['miranda']],
  ['Monte Moria', ['monte moria', 'monte muria']],
  ['Morada de Fátima', ['morada de fatima']],
  ['Novo Horizonte', ['novo horizonte']],
  ['Oliveira', ['oliveira']],
  ['Ouro Verde', ['ouro verde']],
  ['Palmeiras', ['palmeiras', 'palmeiras do imperio']],
  ['Paraíso', ['paraiso']],
  ['Portal de Fátima', ['portal de fatima', 'portal de fatima 1']],
  ['Rosário', ['rosario']],
  ['Santa Goretti', ['santa goretti']],
  ['Santa Helena', ['santa helena', 'sta helena']],
  ['Santa Terezinha', ['santa terezinha', 'sta terezinha', 'santa teresinha']],
  ['Santiago', ['santiago']],
  ['São João', ['sao joao', 'são joão']],
  ['São Judas', ['sao judas', 'são judas']],
  ['São Sebastião', ['sao sebastiao', 'são sebastião', 'assentamento sao sebastiao']],
  ['São Tiago', ['sao tiago', 'são tiago']],
  ['Sewa', ['sewa', 'assentamento sewa', 'swaa']],
  ['Sibipiruna', ['sibipiruna']],
  ['Viena', ['viena', 'vieno', 'vienno', 'vienna', 'assentamento vieno']],
  ['Vila Olímpica', ['vila olimpica', 'vila olipinca']],
  ['Ventania', ['ventania']],
  ['Zona Rural', ['zona rural', 'fazenda']],
];

const officialNorm = new Map();
for (const [name, aliases] of OFFICIAL) {
  for (const a of [norm(name), ...aliases.map(norm)]) {
    officialNorm.set(a, name);
  }
}

function matchOfficial(addr) {
  const n = norm(addr);
  if (!n) return null;

  // direct alias contains (longest first)
  const sorted = [...officialNorm.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, official] of sorted) {
    if (n.includes(alias)) return official;
  }
  return null;
}

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0];
  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    const out = [];
    let cur = '';
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === ',' && !inQ) {
        out.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    rows.push({
      id: out[0],
      address: out[1] || '',
      created_at: out[2],
      name: out[3],
      contact_person: out[4],
    });
  }
  return rows;
}

const rows = parseCsv(fs.readFileSync(path, 'utf8'));

const stats = {
  total: rows.length,
  empty: 0,
  invalid: 0,
  test: 0,
  matched: 0,
  unmatched: 0,
  ambiguous: 0,
};

const byOfficial = new Map();
const unmatchedList = [];
const invalidList = [];

for (const r of rows) {
  const addr = (r.address || '').trim();
  const n = norm(addr);

  if (!addr || n === 'null' || n === 'nao informado') {
    stats.empty++;
    continue;
  }
  if (['aaaa', 'aqui mesmo', 'rua'].includes(n)) {
    stats.invalid++;
    invalidList.push({ id: r.id, address: addr, name: r.name });
    continue;
  }
  if (/^(almeida|potter|teste|barcelos|familia zod|saldanha)$/i.test(norm(r.name))) {
    stats.test++;
    continue;
  }

  const m = matchOfficial(addr);
  if (m) {
    stats.matched++;
    byOfficial.set(m, (byOfficial.get(m) || 0) + 1);
  } else {
    stats.unmatched++;
    unmatchedList.push({ id: r.id, address: addr, name: r.name });
  }
}

console.log('=== ESTATISTICAS ===');
console.log(JSON.stringify(stats, null, 2));
console.log('\n=== POR BAIRRO OFICIAL (matched) ===');
[...byOfficial.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(`${v}\t${k}`));

console.log('\n=== SEM MATCH (' + unmatchedList.length + ') ===');
unmatchedList.forEach((x) => console.log(`- ${x.address}`));

console.log('\n=== INVALIDOS/TESTE ===');
invalidList.forEach((x) => console.log(`- ${x.address} (${x.name})`));
