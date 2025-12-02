/*
  Warnings:

  - Added the required column `pic` to the `repairs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `repairs` ADD COLUMN `component` VARCHAR(191) NULL,
    ADD COLUMN `dp` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `pic` VARCHAR(191) NOT NULL;
