-- create_table.sql
USE smartplant_database;

DROP TABLE IF EXISTS Species;

CREATE TABLE Species (
  species_id INT AUTO_INCREMENT PRIMARY KEY,
  scientific_name VARCHAR(255) NOT NULL,
  common_name VARCHAR(255) NOT NULL,
  is_endangered TINYINT(1) DEFAULT 0,
  description TEXT NULL,           -- normal text for non-endangered species
  description_enc LONGTEXT NULL,   -- encrypted JSON string for endangered species
  image_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO Species (scientific_name, common_name, is_endangered, description, image_url)
VALUES
('Ficus microcarpa', 'Chinese Banyan', 0, 'Common tree found in urban areas', 'http://example.com/banyan.jpg'),
('Rafflesia arnoldii', 'Corpse Flower', 1, NULL, 'http://example.com/rafflesia.jpg');
