CREATE TABLE `presentation_collaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`ownerId` int NOT NULL,
	`collaboratorId` int NOT NULL,
	`permission` enum('view','edit','control') NOT NULL DEFAULT 'control',
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presentation_collaborators_id` PRIMARY KEY(`id`)
);
