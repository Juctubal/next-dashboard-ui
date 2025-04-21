-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables
TRUNCATE TABLE "EventGamefowl" CASCADE;
TRUNCATE TABLE "ConditioningGamefowl" CASCADE;
TRUNCATE TABLE "Conditioning" CASCADE;
TRUNCATE TABLE "ConditioningActivity" CASCADE;
TRUNCATE TABLE "ConditioningProgram" CASCADE;
TRUNCATE TABLE "Event" CASCADE;
TRUNCATE TABLE "Batch" CASCADE;
TRUNCATE TABLE "Incubation" CASCADE;
TRUNCATE TABLE "Breeding" CASCADE;
TRUNCATE TABLE "Vaccine" CASCADE;
TRUNCATE TABLE "Deworming" CASCADE;
TRUNCATE TABLE "Sparring" CASCADE;
TRUNCATE TABLE "Gamefowl" CASCADE;
TRUNCATE TABLE "RecurrentSchedules" CASCADE;
TRUNCATE TABLE "OneTimeSched" CASCADE;
TRUNCATE TABLE "Schedule" CASCADE;
TRUNCATE TABLE "Handler" CASCADE;
TRUNCATE TABLE "Breeder" CASCADE;
TRUNCATE TABLE "Admin" CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin'; 