/*
  Warnings:

  - Added the required column `name` to the `partnerships` table without a default value. This is not possible if the table is not empty.
  - Made the column `image` on table `partnerships` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `partnerships` ADD COLUMN `name` VARCHAR(191) NOT NULL,
    MODIFY `image` VARCHAR(191) NOT NULL;
