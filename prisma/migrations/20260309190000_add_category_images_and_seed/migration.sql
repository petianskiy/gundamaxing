-- AlterTable: Add image column to ForumCategory
ALTER TABLE "ForumCategory" ADD COLUMN "image" TEXT;

-- Update existing categories with images
UPDATE "ForumCategory" SET "image" = '/images/categories/techniques-tutorials.png' WHERE "name" = 'Techniques & Tutorials';
UPDATE "ForumCategory" SET "image" = '/images/categories/kit-reviews.jpg' WHERE "name" = 'Kit Reviews';
UPDATE "ForumCategory" SET "image" = '/images/categories/tools-supplies.png' WHERE "name" = 'Tools & Supplies';
UPDATE "ForumCategory" SET "image" = '/images/categories/trading.png' WHERE "name" = 'Trading Post';
UPDATE "ForumCategory" SET "image" = '/images/categories/off-topic.png' WHERE "name" = 'Off-Topic Hangar';

-- Insert 6 workshop subcategories under "Techniques & Tutorials"
INSERT INTO "ForumCategory" ("id", "name", "description", "icon", "color", "image", "order", "threadCount", "postCount", "parentId")
SELECT
  'sub-painting',
  'Painting',
  'Airbrush, hand painting, and color theory',
  '🎨',
  '#3b82f6',
  '/workshops/painting.jpg',
  1,
  0,
  0,
  fc.id
FROM "ForumCategory" fc WHERE fc."name" = 'Techniques & Tutorials';

INSERT INTO "ForumCategory" ("id", "name", "description", "icon", "color", "image", "order", "threadCount", "postCount", "parentId")
SELECT
  'sub-scribing',
  'Scribing',
  'Panel line scribing and surface detail',
  '✏️',
  '#8b5cf6',
  '/workshops/scribing.jpeg',
  2,
  0,
  0,
  fc.id
FROM "ForumCategory" fc WHERE fc."name" = 'Techniques & Tutorials';

INSERT INTO "ForumCategory" ("id", "name", "description", "icon", "color", "image", "order", "threadCount", "postCount", "parentId")
SELECT
  'sub-decals',
  'Decals',
  'Water slides, dry transfers, and custom prints',
  '🏷️',
  '#10b981',
  '/workshops/decals.jpg',
  3,
  0,
  0,
  fc.id
FROM "ForumCategory" fc WHERE fc."name" = 'Techniques & Tutorials';

INSERT INTO "ForumCategory" ("id", "name", "description", "icon", "color", "image", "order", "threadCount", "postCount", "parentId")
SELECT
  'sub-weathering',
  'Weathering',
  'Washes, chipping, rust, and battle damage',
  '🌧️',
  '#f59e0b',
  '/workshops/weathering.jpg',
  4,
  0,
  0,
  fc.id
FROM "ForumCategory" fc WHERE fc."name" = 'Techniques & Tutorials';

INSERT INTO "ForumCategory" ("id", "name", "description", "icon", "color", "image", "order", "threadCount", "postCount", "parentId")
SELECT
  'sub-leds',
  'LEDs',
  'Electronics, fiber optics, and lighting',
  '💡',
  '#ef4444',
  '/workshops/leds.jpg',
  5,
  0,
  0,
  fc.id
FROM "ForumCategory" fc WHERE fc."name" = 'Techniques & Tutorials';

INSERT INTO "ForumCategory" ("id", "name", "description", "icon", "color", "image", "order", "threadCount", "postCount", "parentId")
SELECT
  'sub-kitbash',
  'Kitbash',
  'Cross-kit builds, scratch building, and 3D printing',
  '🔧',
  '#6366f1',
  '/workshops/kitbush.jpg',
  6,
  0,
  0,
  fc.id
FROM "ForumCategory" fc WHERE fc."name" = 'Techniques & Tutorials';

-- Insert default active Monthly Mission
INSERT INTO "MonthlyMission" ("id", "title", "description", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES (
  'mission-march-2026',
  'Weathering Challenge',
  'Build and weather any kit using at least 3 different techniques. Show your process!',
  '2026-03-01T00:00:00.000Z',
  '2026-03-31T23:59:59.000Z',
  true,
  NOW(),
  NOW()
);
