import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Database types

export type Circuit = {
  id: string;                   // uuid
  name: string;                 // text NOT NULL
  location: string;             // text NOT NULL
  length: string;               // text NOT NULL (aunque es longitud, es string según esquema)
  turns: number;                // integer NOT NULL
  record_lap_time: string | null;    // text nullable
  record_lap_pilot: string | null;   // text nullable
  image_url: string | null;          // text nullable
  description: string | null;         // text nullable
  created_at: string | null;          // timestamp with time zone DEFAULT now()
};

export type LapTime = {
  id: string;                   // uuid
  race_id: string | null;       // uuid, FK nullable
  pilot_id: string | null;      // uuid, FK nullable
  session_id: string | null;    // uuid, FK nullable
  lap_number: number;           // integer NOT NULL
  time: string | null;          // text nullable
  created_at: string | null;    // timestamp with time zone DEFAULT now()
  pilot?: Pilot;
  race?: Race;
  session?: Session;
};

export type League = {
  id: string;                   // uuid
  name: string;                 // text NOT NULL
  description: string | null;   // text nullable
  created_at: string | null;    // timestamp with time zone DEFAULT now()
  season_id: string | null;     // uuid nullable FK
  season?: Season;
};

export type Pilot = {
  id: string;                   // uuid
  user_id: string | null;       // uuid nullable FK
  role: string;                 // text NOT NULL
  name: string;                 // text NOT NULL
  number: number;               // integer NOT NULL UNIQUE
  avatar_url: string | null;    // text nullable
  created_at: string | null;    // timestamp with time zone DEFAULT now()
};

export type PilotTeamSeason = {
  id: string;                   // uuid
  pilot_id: string | null;      // uuid nullable FK
  team_id: string | null;       // uuid nullable FK
  season_id: string | null;     // uuid nullable FK
  league_id: string | null;     // uuid nullable FK
  created_at: string | null;    // timestamp with time zone DEFAULT now()
  pilot?: Pilot;
  team?: Team;
  league?: League;
  season?: Season;
};

export type Race = {
  id: string;                   // uuid
  name: string;                 // text NOT NULL
  circuit_id: string | null;    // uuid nullable FK
  date: string;                 // date NOT NULL (ISO string)
  created_at: string | null;    // timestamp with time zone DEFAULT now()
  league_id: string | null;    // uuid nullable FK
  circuit?: Circuit;
  league?: League;
};

export type RaceResult = {
  id: string;                   // uuid
  race_id: string | null;       // uuid nullable FK
  pilot_id: string | null;      // uuid nullable FK
  session_id: string | null;    // uuid nullable FK
  race_position: number | null; // integer nullable
  best_lap: string | null;      // text nullable
  points: number | null;        // smallint nullable
  created_at: string | null;    // timestamp with time zone DEFAULT now()
  pilot?: Pilot;
  race?: Race;
  session?: Session;
};

export type Season = {
  id: string;                   // uuid
  league_id?: string | null;    // No league_id column in season table, but league has season_id FK
  name: string;                 // text NOT NULL
  start_date: string;           // date NOT NULL
  end_date: string;             // date NOT NULL
  is_active: boolean | null;    // boolean DEFAULT false
  created_at: string | null;    // timestamp with time zone DEFAULT now()
  league?: League;              // league has season_id FK, so optional relation
};

export type Session = {
  id: string;                   // uuid
  name: string;                 // text NOT NULL
};

export type Team = {
  id: string;                   // uuid
  name: string;                 // text NOT NULL
  logo_url: string | null;      // text nullable
  created_at: string | null;    // timestamp with time zone DEFAULT now()
};

// Optional frontend-only types

export type PilotStanding = {
  pilot_id: string;
  pilot_name: string;
  pilot_number: number;
  team_name: string;
  total_points: number;
  position: number;
};

export type TeamStanding = {
  team_id: string;
  team_name: string;
  total_points: number;
  position: number;
  pilots_list: string[];
};
