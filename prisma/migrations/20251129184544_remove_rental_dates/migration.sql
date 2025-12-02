/*
  Warnings:

  - You are about to drop the column `end_date` on the `rentals` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `rentals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE rentals
  DROP COLUMN start_date,
  DROP COLUMN end_date;

