/*
  Warnings:

  - You are about to drop the column `extra` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `pph` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `pph_nominal` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `subExtraValue` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `product_specifications` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `extra`,
    DROP COLUMN `pph`,
    DROP COLUMN `pph_nominal`,
    DROP COLUMN `subExtraValue`,
    ADD COLUMN `ppn` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `ppn_nominal` DOUBLE NULL DEFAULT 0;
