/*
  Warnings:

  - Added the required column `grand_total` to the `repairs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product_specifications` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `repairs` ADD COLUMN `extra` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `grand_total` DOUBLE NOT NULL,
    ADD COLUMN `pph` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `pph_nominal` DOUBLE NULL DEFAULT 0;
