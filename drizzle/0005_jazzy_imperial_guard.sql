CREATE TABLE `presenter_cursors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`zoomLevel` int NOT NULL DEFAULT 100,
	`cursorX` int NOT NULL DEFAULT 0,
	`cursorY` int NOT NULL DEFAULT 0,
	`cursorVisible` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presenter_cursors_id` PRIMARY KEY(`id`)
);
