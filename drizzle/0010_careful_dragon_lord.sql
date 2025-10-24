CREATE TABLE `commercial_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` text,
	`used` boolean NOT NULL DEFAULT false,
	`userId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	CONSTRAINT `commercial_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercial_invitations_token_unique` UNIQUE(`token`)
);
