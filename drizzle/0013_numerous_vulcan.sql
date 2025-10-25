ALTER TABLE `commercial_invitations` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `commercial_invitations` ADD `revoked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `commercial_invitations` ADD `lastUsedAt` timestamp;--> statement-breakpoint
ALTER TABLE `commercial_invitations` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `commercial_invitations` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `commercial_invitations` DROP COLUMN `used`;--> statement-breakpoint
ALTER TABLE `commercial_invitations` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `commercial_invitations` DROP COLUMN `usedAt`;