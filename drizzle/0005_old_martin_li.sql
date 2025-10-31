CREATE TABLE `saved_prospects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactData` text NOT NULL,
	`enrichedData` text,
	`status` enum('nouveau','en_cours','relance','converti','perdu') NOT NULL DEFAULT 'nouveau',
	`rappelDate` timestamp,
	`notes` text,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_prospects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `deviceModel`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `language`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `timezone`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `country`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `city`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `fullName`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `jobTitle`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `company`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `age`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `photoUrl`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `linkedinUrl`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `education`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `companySize`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `industry`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `connectionTime`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `pagesViewed`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `isActive`;--> statement-breakpoint
ALTER TABLE `presentation_viewers` DROP COLUMN `reconnections`;