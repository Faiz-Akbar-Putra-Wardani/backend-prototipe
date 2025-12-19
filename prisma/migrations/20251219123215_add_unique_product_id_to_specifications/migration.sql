/*
  Warnings:

  - A unique constraint covering the columns `[product_id]` on the table `product_specifications` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `product_specifications` ALTER COLUMN `updated_at` DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX `product_specifications_product_id_key` ON `product_specifications`(`product_id`);
