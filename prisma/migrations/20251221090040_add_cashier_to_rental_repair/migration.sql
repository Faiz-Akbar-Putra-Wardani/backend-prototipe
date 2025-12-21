/*
  Warnings:

  - Added the required column `cashier_id` to the `rentals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cashier_id` to the `repairs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product_specifications` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `rentals` ADD COLUMN `cashier_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `repairs` ADD COLUMN `cashier_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `rentals` ADD CONSTRAINT `rentals_cashier_id_fkey` FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `repairs` ADD CONSTRAINT `repairs_cashier_id_fkey` FOREIGN KEY (`cashier_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
