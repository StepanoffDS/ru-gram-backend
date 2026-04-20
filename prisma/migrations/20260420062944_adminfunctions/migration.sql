-- AlterTable
ALTER TABLE "users" ADD COLUMN     "blocked_at" TIMESTAMP(3),
ADD COLUMN     "blocked_by_id" TEXT,
ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_blocked_by_id_fkey" FOREIGN KEY ("blocked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
