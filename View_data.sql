-- view_table.sql
USE smartplant_database;

DROP VIEW IF EXISTS v_species_encryption_check;

CREATE VIEW v_species_encryption_check AS
SELECT
  species_id,
  scientific_name,
  common_name,
  is_endangered,
  description,
  description_enc,
  CASE
    WHEN is_endangered = 1 AND description_enc IS NOT NULL THEN 'Encrypted'
    WHEN is_endangered = 0 AND description IS NOT NULL THEN 'Plain Text'
    ELSE 'Missing Data'
  END AS data_status,
  created_at
FROM Species;

SELECT * FROM v_species_encryption_check;
