CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`senderType` enum('presenter','viewer') NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`videoUrl` text,
	`fileType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commercial_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`firstName` text,
	`photoUrl` text,
	`phone` text,
	`email` text,
	`revoked` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercial_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercial_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE `presentation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`presenterId` int NOT NULL,
	`sessionCode` varchar(32) NOT NULL,
	`title` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`currentDocumentId` int,
	`currentOrientation` enum('portrait','landscape') NOT NULL DEFAULT 'portrait',
	`allowViewerUploads` boolean NOT NULL DEFAULT false,
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
--> statement-breakpoint
CREATE TABLE `presenter_cursors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`zoomLevel` int NOT NULL DEFAULT 100,
	`cursorX` float NOT NULL DEFAULT 0,
	`cursorY` float NOT NULL DEFAULT 0,
	`cursorVisible` boolean NOT NULL DEFAULT false,
	`panOffsetX` float NOT NULL DEFAULT 0,
	`panOffsetY` float NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presenter_cursors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','commercial') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
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
