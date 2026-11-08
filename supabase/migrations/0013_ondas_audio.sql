-- ════════════════════════════════════════════════════════════════════
-- Puerta Abierta · 0013 · Onda de los mensajes de voz (como en WhatsApp).
-- Al grabar se guardan ~40 niveles de volumen (0 a 100) para dibujar las barras.
-- Requiere 0012. Pegar completo en Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════════

alter table public.mensajes add column if not exists onda smallint[]
  check (onda is null or (cardinality(onda) <= 64 and 0 <= all (onda) and 100 >= all (onda)));

grant insert (onda) on public.mensajes to authenticated;
