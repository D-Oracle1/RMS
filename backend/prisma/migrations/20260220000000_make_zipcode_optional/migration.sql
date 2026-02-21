-- AlterTable: make zipCode nullable and update country default
ALTER TABLE "properties" ALTER COLUMN "zipCode" DROP NOT NULL;
ALTER TABLE "properties" ALTER COLUMN "country" SET DEFAULT 'Nigeria';
