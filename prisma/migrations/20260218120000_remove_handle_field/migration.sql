-- DropIndex
DROP INDEX IF EXISTS "User_handle_idx";

-- DropIndex
DROP INDEX IF EXISTS "User_handle_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "handle";
