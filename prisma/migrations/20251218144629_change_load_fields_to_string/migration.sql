/*
  Warnings:

  - You are about to alter the column `load_100` on the `product_specifications` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.
  - You are about to alter the column `load_75` on the `product_specifications` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.
  - You are about to alter the column `load_50` on the `product_specifications` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `product_specifications` MODIFY `load_100` VARCHAR(191) NOT NULL,
    MODIFY `load_75` VARCHAR(191) NOT NULL,
    MODIFY `load_50` VARCHAR(191) NOT NULL,
    ALTER COLUMN `updated_at` DROP DEFAULT;
