/*
  Warnings:

  - You are about to drop the column `ppn` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `ppn`,
    ADD COLUMN `extra` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `pph` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `pph_nominal` DOUBLE NULL DEFAULT 0;
