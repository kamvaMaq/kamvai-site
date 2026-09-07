CREATE TABLE `prompt_state` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`promptId` varchar(96) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` varchar(255) NOT NULL,
	`category` enum('Strategy','Writing','Campaigns','Build','Visual') NOT NULL,
	`mode` enum('blog','email','code','image','chat','video') NOT NULL,
	`body` text NOT NULL,
	`isCustom` boolean NOT NULL DEFAULT false,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`favoritePosition` int NOT NULL DEFAULT 0,
	`recentPosition` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prompt_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `prompt_state_user_prompt_idx` UNIQUE(`userId`,`promptId`)
);
--> statement-breakpoint
CREATE INDEX `prompt_state_user_favorites_idx` ON `prompt_state` (`userId`,`isFavorite`,`favoritePosition`);--> statement-breakpoint
CREATE INDEX `prompt_state_user_recents_idx` ON `prompt_state` (`userId`,`recentPosition`,`lastUsedAt`);