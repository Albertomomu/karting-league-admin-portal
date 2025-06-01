// src/lib/supabaseTypes.ts

export type Circuit = {
  id: string;
  name: string;
};

export type League = {
  id: string;
  name: string;
  season_id: string;
};

export type Season = {
  id: string;
  name: string;
};

export type Pilot = {
  id: string;
  name: string;
  number: number;
  avatar_url: string | null;
  created_at: string;
  user_id: string;
  role: string;
};

export type Team = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type Race = {
  id: string;
  name: string;
  date: string;
  circuit: Circuit;
  league: League;
};

export type Session = {
  id: string;
  name: string;
  race_id: string;
};

export type Result = {
  id: string;
  pilot_id: string;
  race_id: string;
  session_id: string;
  position: number;
  points: number;
  best_lap: boolean;
};

export type LapTime = {
  id: string;
  pilot_id: string;
  session_id: string;
  race_id: string;
  time: number;
};
