-- AlterTable
ALTER TABLE `users` ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'admin';

-- Update user pertama (dari seeder) menjadi super_admin
UPDATE `users` SET `role` = 'super_admin' WHERE `email` = 'ses@gmail.com';
