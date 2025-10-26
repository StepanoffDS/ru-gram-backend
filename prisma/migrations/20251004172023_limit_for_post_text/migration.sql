/*
  Warnings:

  - You are about to alter the column `text` on the `posts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.

*/
-- AlterTable
ALTER TABLE "posts" ALTER COLUMN "text" SET DATA TYPE VARCHAR(1000);
