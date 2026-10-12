INSERT INTO "Room" ("id", "type", "capacity", "hasProjector", "createdAt", "updatedAt")
VALUES
  ('101', 'Sala Ćwiczeniowa', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('102', 'Sala Ćwiczeniowa', 20, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('AULA_A', 'Aula Wykładowa', 200, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LAB_1', 'Laboratorium IT', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
