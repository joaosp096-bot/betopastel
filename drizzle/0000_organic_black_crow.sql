CREATE TABLE `beto_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`version` integer NOT NULL,
	`action` text NOT NULL,
	`payload` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_beto_revisions_owner_version` ON `beto_revisions` (`owner`,`version`);--> statement-breakpoint
CREATE TABLE `beto_workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated` text NOT NULL
);
