-- Lado do restaurante: cardápio por foto, recado da casa e prévia desfocada (BlurHash) das fotos.
-- As fotos vão para o bucket covers, que a 0004 já limita a 2 MB e a JPEG, PNG e WebP.

-- Páginas do cardápio, em ordem: [{"url": "...", "blurhash": "...", "w": 1200, "h": 1600}]
alter table places add column if not exists menu_photos jsonb not null default '[]';
-- Prévia desfocada da foto de capa enviada pelo dono (gerada no navegador).
alter table places add column if not exists cover_blurhash text;
-- Recado da casa, escrito pelo dono (até 280 caracteres).
alter table places add column if not exists about text;
