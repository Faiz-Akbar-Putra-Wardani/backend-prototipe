/*
  Warnings:

  - You are about to drop the column `product_id` on the `repairs` table. All the data in the column will be lost.
  - You are about to drop the column `cash` on the `transactions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `repairs` DROP FOREIGN KEY `repairs_product_id_fkey`;

-- DropIndex
DROP INDEX `repairs_product_id_fkey` ON `repairs`;

-- AlterTable
ALTER TABLE `repairs` DROP COLUMN `product_id`;

-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `cash`;
