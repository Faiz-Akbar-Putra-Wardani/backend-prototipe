/*
  Warnings:

  - Added the required column `project_category_id` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product_specifications` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `projects` ADD COLUMN `project_category_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `project_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `project_categories_uuid_key`(`uuid`),
    UNIQUE INDEX `project_categories_name_key`(`name`),
    UNIQUE INDEX `project_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_project_category_id_fkey` FOREIGN KEY (`project_category_id`) REFERENCES `project_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
