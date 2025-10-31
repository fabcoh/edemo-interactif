ALTER TABLE `presentation_viewers` ADD `deviceType` varchar(20);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `browser` varchar(100);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `os` varchar(100);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `deviceModel` varchar(100);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `language` varchar(10);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `timezone` varchar(50);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `screenResolution` varchar(20);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `phone` varchar(50);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `fullName` varchar(255);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `jobTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `company` varchar(255);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `age` int;--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `linkedinUrl` text;--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `education` text;--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `companySize` varchar(50);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `industry` varchar(255);--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `connectionTime` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `pagesViewed` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `isActive` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `presentation_viewers` ADD `reconnections` int DEFAULT 0;