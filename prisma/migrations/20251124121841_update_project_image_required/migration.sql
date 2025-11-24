/*
  Warnings:

  - Made the column `image` on table `projects` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `projects` MODIFY `image` VARCHAR(191) NOT NULL;
