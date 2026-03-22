CREATE TABLE `learning_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`merchant_pattern` text NOT NULL,
	`category_id` integer,
	`use_count` integer DEFAULT 1,
	`last_used` integer,
	`created_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `mtd_box` integer;--> statement-breakpoint
ALTER TABLE `categories` ADD `sort_order` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `categories` ADD `is_default` integer DEFAULT false;