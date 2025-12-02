/*
  Warnings:

  - You are about to drop the column `custom_item` on the `repairs` table. All the data in the column will be lost.
  - Added the required column `item_repair` to the `repairs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `repairs` DROP COLUMN `custom_item`,
    ADD COLUMN `item_repair` VARCHAR(191) NOT NULL;
