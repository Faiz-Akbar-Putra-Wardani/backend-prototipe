/*
  Warnings:

  - You are about to drop the column `customer_id` on the `profits` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `profits` DROP FOREIGN KEY `profits_customer_id_fkey`;

-- DropIndex
DROP INDEX `profits_customer_id_fkey` ON `profits`;

-- AlterTable
ALTER TABLE `profits` DROP COLUMN `customer_id`;
