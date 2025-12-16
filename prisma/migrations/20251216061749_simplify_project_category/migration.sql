/*
  Warnings:

  - You are about to drop the column `color` on the `project_categories` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `project_categories` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `project_categories` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `project_categories` table. All the data in the column will be lost.
  - You are about to drop the column `sort_order` on the `project_categories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `product_specifications` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `project_categories` DROP COLUMN `color`,
    DROP COLUMN `description`,
    DROP COLUMN `icon`,
    DROP COLUMN `is_active`,
    DROP COLUMN `sort_order`;
