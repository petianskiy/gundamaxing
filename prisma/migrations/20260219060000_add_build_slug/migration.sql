-- AlterTable
ALTER TABLE "Build" ADD COLUMN "slug" TEXT;

-- Backfill existing builds with slugs derived from title + id prefix
UPDATE "Build" SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || SUBSTRING(id, 1, 6)
WHERE slug IS NULL;

-- Make column required
ALTER TABLE "Build" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Build_slug_key" ON "Build"("slug");
