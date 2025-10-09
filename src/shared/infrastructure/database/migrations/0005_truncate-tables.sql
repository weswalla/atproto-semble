-- Custom SQL migration file, put your code below! --
-- Truncate all tables to wipe data but keep table structure
-- CASCADE ensures foreign key constraints don't prevent truncation
TRUNCATE TABLE "collection_cards",
"collection_collaborators",
"library_memberships",
"collections",
"cards",
"published_records",
"feed_activities" CASCADE;