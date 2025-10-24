CREATE TABLE `viewer_cursors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`viewerIdentifier` varchar(64) NOT NULL,
	`cursorX` float NOT NULL DEFAULT 0,
	`cursorY` float NOT NULL DEFAULT 0,
	`cursorVisible` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `viewer_cursors_id` PRIMARY KEY(`id`)
);
