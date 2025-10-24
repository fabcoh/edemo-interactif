CREATE TABLE `presentation_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(20) NOT NULL DEFAULT '#3B82F6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presentation_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presenter_cursors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`cursorX` int NOT NULL,
	`cursorY` int NOT NULL,
	`zoomLevel` int NOT NULL DEFAULT 100,
	`panX` int NOT NULL DEFAULT 0,
	`panY` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presenter_cursors_id` PRIMARY KEY(`id`)
);
