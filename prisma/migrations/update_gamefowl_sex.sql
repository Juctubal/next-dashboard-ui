-- Update male gamefowls (COCK, STAG, BULLSTAG)
UPDATE "Gamefowl"
SET sex = 'MALE'
WHERE age IN ('COCK', 'STAG', 'BULLSTAG')
AND sex IS NULL;

-- Update remaining gamefowls as female
UPDATE "Gamefowl"
SET sex = 'FEMALE'
WHERE sex IS NULL; 