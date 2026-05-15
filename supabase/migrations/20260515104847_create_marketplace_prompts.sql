/*
  # Marketplace Prompts Table

  1. New Tables
    - `marketplace_prompts`
      - `id` (serial, primary key)
      - `title` (text) - prompt display name
      - `description` (text) - short description
      - `prompt_text` (text) - the actual reusable prompt template
      - `category` (text) - e.g. Engineering, Testing, Database
      - `author` (text) - creator name
      - `tags` (text[]) - searchable tag array
      - `uses` (integer) - total usage count
      - `rating` (numeric) - average star rating 0-5
      - `success_pct` (numeric) - success percentage 0-100
      - `avg_tokens` (integer) - average tokens consumed per use
      - `verified` (boolean) - whether prompt is verified/curated
      - `featured` (boolean) - whether shown in "top prompts"
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public read access (analytics dashboard, no auth required)
    - Service role insert/update for seeding
*/

CREATE TABLE IF NOT EXISTS marketplace_prompts (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  prompt_text text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Engineering',
  author text NOT NULL DEFAULT 'Community',
  tags text[] DEFAULT '{}',
  uses integer DEFAULT 0,
  rating numeric DEFAULT 0,
  success_pct numeric DEFAULT 0,
  avg_tokens integer DEFAULT 0,
  verified boolean DEFAULT false,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read marketplace_prompts"
  ON marketplace_prompts FOR SELECT TO anon USING (true);

CREATE POLICY "Service insert marketplace_prompts"
  ON marketplace_prompts FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service update marketplace_prompts"
  ON marketplace_prompts FOR UPDATE TO service_role USING (true) WITH CHECK (true);
