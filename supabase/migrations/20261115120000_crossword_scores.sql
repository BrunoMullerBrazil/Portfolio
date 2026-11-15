-- Ranking mundial da Cruzada Sem Fim (aue.productions/crossword-arcade).
-- A página lê e grava direto pela API REST com a chave anon.
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  level text not null check (level in ('easy','med','hard')),
  initials text not null check (initials ~ '^[A-Z?]{1,3}$'),
  score int not null check (score between 1 and 500000),
  words int not null check (words between 1 and 500),
  stage int not null check (stage between 1 and 100),
  -- barra pontuação impossível para o número de palavras
  check (score <= words * 3000)
);

create index if not exists scores_rank on public.scores (level, score desc);

alter table public.scores enable row level security;

drop policy if exists "ler ranking" on public.scores;
create policy "ler ranking" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "enviar recorde" on public.scores;
create policy "enviar recorde" on public.scores
  for insert to anon, authenticated with check (true);

grant select, insert on public.scores to anon, authenticated;
