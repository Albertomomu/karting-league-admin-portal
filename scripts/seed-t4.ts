import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// --- Data definitions ---

type RosterEntry = { team: string; pilots: string[] };

const K1_ROSTER: RosterEntry[] = [
  { team: 'ONLYGASS RACING', pilots: ['ADRICELLI', 'MARC MTNZ'] },
  { team: 'WM MOTORSPORT', pilots: ['WONKA', 'MURILLO'] },
  { team: 'RD ARROWS KARTING', pilots: ['DELGADO_F4', 'RUBIO'] },
  { team: 'SCUDERIA MAZETA RACING TEAM', pilots: ['MAXIM21', 'ZETA'] },
  { team: 'RDK FACTORY', pilots: ['JOSUE', 'SAIMON'] },
  { team: 'LEVEL UP RACING', pilots: ['RODRIGO', 'RENTO'] },
  { team: 'TEAM BIRRINA', pilots: ['PEPE', 'MOLLEJAS'] },
  { team: 'V&K TEAM KART', pilots: ['V.CUENCA', 'A. KEDAR'] },
];

const K2_ROSTER: RosterEntry[] = [
  { team: 'SANSON RACING TEAM', pilots: ['EL CANELA', 'EL PEREJIL'] },
  { team: 'NEMESIS SPORTS', pilots: ['D.JIMENEZ', 'G.TARAZONA'] },
  { team: 'EL SUFLE', pilots: ['ERIC42', 'MASCARELL'] },
  { team: 'KMK RACING TEAM', pilots: ['DJSERBA', 'PITI'] },
  { team: 'LOS QUEMARUEDAS', pilots: ['LUCAS', 'GUILLE'] },
  { team: 'THE CONEHEADS', pilots: ['HUMPERDOO', 'VIDAL'] },
  { team: 'TERRETA RACING TEAM', pilots: ['BERNET', 'AYALA'] },
  { team: 'PICKPOCKET RACING', pilots: ['SIMEON ORTEGA', 'HILARIO'] },
];

// VIDAL in roster = VIDAL12 in DB
const PILOT_ALIAS: Record<string, string> = {
  'VIDAL': 'VIDAL12',
};

const PREV_SEASON_ID = 'acd12787-b4d3-44b8-af34-4754cd2562b3';

// --- Helpers ---

function normalize(name: string): string {
  return name.trim().toUpperCase();
}

function resolveAlias(name: string): string {
  const n = normalize(name);
  return PILOT_ALIAS[n] ?? n;
}

// --- Main ---

async function main() {
  console.log('=== Seed Temporada 4 ===\n');

  // Step 2: Load existing data
  const { data: existingPilots } = await supabase.from('pilot').select('id, name, number');
  const { data: existingTeams } = await supabase.from('team').select('id, name');

  const pilotMap = new Map<string, { id: string; number: number }>();
  let maxNumber = 0;
  for (const p of existingPilots ?? []) {
    pilotMap.set(normalize(p.name), { id: p.id, number: p.number });
    if (p.number > maxNumber) maxNumber = p.number;
  }

  const teamMap = new Map<string, { id: string }>();
  for (const t of existingTeams ?? []) {
    teamMap.set(normalize(t.name), { id: t.id });
  }

  console.log(`Pilotos existentes: ${pilotMap.size}`);
  console.log(`Equipos existentes: ${teamMap.size}`);
  console.log(`Dorsal máximo actual: ${maxNumber}\n`);

  // Step 3: Deactivate previous season
  const { error: deactivateErr } = await supabase
    .from('season')
    .update({ is_active: false })
    .eq('id', PREV_SEASON_ID);
  if (deactivateErr) throw new Error(`Error desactivando temporada anterior: ${deactivateErr.message}`);
  console.log('Temporada anterior desactivada.');

  // Step 4: Create season
  const seasonName = 'Temporada 2026';
  let { data: existingSeason } = await supabase
    .from('season')
    .select('id')
    .eq('name', seasonName)
    .maybeSingle();

  let seasonId: string;
  if (existingSeason) {
    seasonId = existingSeason.id;
    console.log(`Temporada "${seasonName}" ya existe (${seasonId}).`);
  } else {
    const { data: newSeason, error } = await supabase
      .from('season')
      .insert({ name: seasonName, start_date: '2026-01-01', end_date: '2026-12-31', is_active: true })
      .select('id')
      .single();
    if (error) throw new Error(`Error creando temporada: ${error.message}`);
    seasonId = newSeason.id;
    console.log(`Temporada "${seasonName}" creada (${seasonId}).`);
  }

  // Step 5: Create leagues
  async function getOrCreateLeague(name: string): Promise<string> {
    const { data: existing } = await supabase
      .from('league')
      .select('id')
      .eq('name', name)
      .eq('season_id', seasonId)
      .maybeSingle();

    if (existing) {
      console.log(`Liga "${name}" ya existe (${existing.id}).`);
      return existing.id;
    }

    const { data: created, error } = await supabase
      .from('league')
      .insert({ name, description: `Liga ${name} de la Temporada 2026`, season_id: seasonId })
      .select('id')
      .single();
    if (error) throw new Error(`Error creando liga ${name}: ${error.message}`);
    console.log(`Liga "${name}" creada (${created.id}).`);
    return created.id;
  }

  const k1LeagueId = await getOrCreateLeague('K1');
  const k2LeagueId = await getOrCreateLeague('K2');

  // Step 6: Create new teams
  const allTeamNames = [...K1_ROSTER, ...K2_ROSTER].map(r => normalize(r.team));
  const uniqueTeamNames = [...new Set(allTeamNames)];
  let teamsCreated = 0;

  for (const name of uniqueTeamNames) {
    if (teamMap.has(name)) continue;

    const { data: created, error } = await supabase
      .from('team')
      .insert({ name })
      .select('id')
      .single();
    if (error) throw new Error(`Error creando equipo "${name}": ${error.message}`);
    teamMap.set(name, { id: created.id });
    teamsCreated++;
  }
  console.log(`\nEquipos nuevos creados: ${teamsCreated}`);

  // Step 7: Create new pilots
  const allPilotNames = [...K1_ROSTER, ...K2_ROSTER].flatMap(r => r.pilots.map(resolveAlias));
  const uniquePilotNames = [...new Set(allPilotNames)];
  let pilotsCreated = 0;

  for (const name of uniquePilotNames) {
    if (pilotMap.has(name)) continue;

    maxNumber++;
    const { data: created, error } = await supabase
      .from('pilot')
      .insert({ name, number: maxNumber, role: 'pilot' })
      .select('id, number')
      .single();
    if (error) throw new Error(`Error creando piloto "${name}" (#${maxNumber}): ${error.message}`);
    pilotMap.set(name, { id: created.id, number: created.number });
    pilotsCreated++;
  }
  console.log(`Pilotos nuevos creados: ${pilotsCreated}`);

  // Step 8: Create pilot_team_season records
  async function createPTS(roster: RosterEntry[], leagueId: string, leagueName: string) {
    let created = 0;
    let skipped = 0;

    for (const entry of roster) {
      const teamId = teamMap.get(normalize(entry.team))?.id;
      if (!teamId) throw new Error(`Equipo no encontrado: ${entry.team}`);

      for (const pilotName of entry.pilots) {
        const resolved = resolveAlias(pilotName);
        const pilotId = pilotMap.get(resolved)?.id;
        if (!pilotId) throw new Error(`Piloto no encontrado: ${resolved}`);

        // Check if already exists (idempotency)
        const { data: existing } = await supabase
          .from('pilot_team_season')
          .select('id')
          .eq('pilot_id', pilotId)
          .eq('team_id', teamId)
          .eq('season_id', seasonId)
          .eq('league_id', leagueId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const { error } = await supabase
          .from('pilot_team_season')
          .insert({
            pilot_id: pilotId,
            team_id: teamId,
            season_id: seasonId,
            league_id: leagueId,
            is_wildkart: false,
            license_points: 10,
          });
        if (error) throw new Error(`Error creando PTS para ${resolved} en ${entry.team}: ${error.message}`);
        created++;
      }
    }
    console.log(`  ${leagueName}: ${created} creados, ${skipped} ya existían`);
  }

  console.log('\nRegistros pilot_team_season:');
  await createPTS(K1_ROSTER, k1LeagueId, 'K1');
  await createPTS(K2_ROSTER, k2LeagueId, 'K2');

  // Step 9: Summary
  console.log('\n=== Resumen ===');
  console.log(`Temporada: ${seasonName} (${seasonId})`);
  console.log(`Liga K1: ${k1LeagueId}`);
  console.log(`Liga K2: ${k2LeagueId}`);
  console.log(`Equipos nuevos: ${teamsCreated}`);
  console.log(`Pilotos nuevos: ${pilotsCreated}`);
  console.log('Done!');
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
