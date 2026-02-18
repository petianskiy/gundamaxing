-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_identifier_token_key" ON "PasswordResetToken"("identifier", "token");

-- CreateTable
CREATE TABLE "EmailChangeToken" (
    "identifier" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeToken_token_key" ON "EmailChangeToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeToken_identifier_token_key" ON "EmailChangeToken"("identifier", "token");

-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'EMAIL_CHANGE_REQUESTED';
ALTER TYPE "EventType" ADD VALUE 'EMAIL_CHANGE_COMPLETE';
