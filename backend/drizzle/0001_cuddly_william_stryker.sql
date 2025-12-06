CREATE TABLE `pokemon_types` (
	`pokemon_id` integer NOT NULL,
	`type_id` integer NOT NULL,
	FOREIGN KEY (`pokemon_id`) REFERENCES `pokemon`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`type_id`) REFERENCES `types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `types` (
	`id` integer PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_fr` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `pokemon` ADD `name_fr` text NOT NULL;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `name_en` text NOT NULL;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `description_fr` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `description_en` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `category_fr` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `category_en` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `sprite_normal` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `sprite_shiny` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `sprite_home` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `sprite_home_shiny` text;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `hp` integer;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `attack` integer;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `defense` integer;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `special_attack` integer;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `special_defense` integer;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `speed` integer;--> statement-breakpoint
ALTER TABLE `pokemon` ADD `generation` integer;--> statement-breakpoint
ALTER TABLE `pokemon` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `pokemon` DROP COLUMN `sprite`;--> statement-breakpoint
ALTER TABLE `pokemon` DROP COLUMN `types`;