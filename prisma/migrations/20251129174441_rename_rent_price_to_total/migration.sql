/*
  Warnings:

  - You are about to drop the column `rent_price` on the `rentals` table. All the data in the column will be lost.
  - Added the required column `total_rent_price` to the `rentals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE rentals
CHANGE rent_price total_rent_price DOUBLE NOT NULL;


