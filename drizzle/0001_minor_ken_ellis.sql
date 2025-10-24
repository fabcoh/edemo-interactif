CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('pdf','image','video') NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`displayOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presentation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`presenterId` int NOT NULL,
	`sessionCode` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`currentDocumentId` int,
	`currentOrientation` enum('portrait','landscape') NOT NULL DEFAULT 'portrait',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presentation_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `presentation_sessions_sessionCode_unique` UNIQUE(`sessionCode`)
);
--> statement-breakpoint
CREATE TABLE `presentation_viewers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int,
	`viewerIdentifier` varchar(64),
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `presentation_viewers_id` PRIMARY KEY(`id`)
);
