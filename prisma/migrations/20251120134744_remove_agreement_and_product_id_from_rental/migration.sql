/*
  Warnings:

  - You are about to drop the column `agreement` on the `rentals` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `rentals` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `rentals` DROP FOREIGN KEY `rentals_product_id_fkey`;

-- DropIndex
DROP INDEX `rentals_product_id_fkey` ON `rentals`;

-- AlterTable
ALTER TABLE `rentals` DROP COLUMN `agreement`,
    DROP COLUMN `product_id`,
    ADD COLUMN `dp` DOUBLE NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `rental_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rental_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,
    `rent_price` DOUBLE NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rental_details` ADD CONSTRAINT `rental_details_rental_id_fkey` FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rental_details` ADD CONSTRAINT `rental_details_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
