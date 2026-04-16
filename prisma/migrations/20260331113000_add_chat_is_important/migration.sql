-- AlterTable
ALTER TABLE "public"."chat_read_states"
ADD COLUMN "is_important" BOOLEAN NOT NULL DEFAULT false;
