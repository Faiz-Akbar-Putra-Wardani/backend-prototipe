-- DropForeignKey
ALTER TABLE `profits` DROP FOREIGN KEY `profits_rental_id_fkey`;

-- DropForeignKey
ALTER TABLE `profits` DROP FOREIGN KEY `profits_repair_id_fkey`;

-- DropForeignKey
ALTER TABLE `profits` DROP FOREIGN KEY `profits_transaction_id_fkey`;

-- DropIndex
DROP INDEX `profits_rental_id_fkey` ON `profits`;

-- DropIndex
DROP INDEX `profits_repair_id_fkey` ON `profits`;

-- DropIndex
DROP INDEX `profits_transaction_id_fkey` ON `profits`;

-- AlterTable
ALTER TABLE `product_specifications` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `profits` ADD CONSTRAINT `profits_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profits` ADD CONSTRAINT `profits_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profits` ADD CONSTRAINT `profits_repair_id_fkey` FOREIGN KEY (`repair_id`) REFERENCES `repairs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
