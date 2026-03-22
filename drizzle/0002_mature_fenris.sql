CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`date` integer NOT NULL,
	`category_id` integer,
	`bank_connection_id` text,
	`account_id` text,
	`currency` text DEFAULT 'GBP' NOT NULL,
	`merchant` text,
	`metadata` text,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bank_connection_id`) REFERENCES `bank_connections`(`id`) ON UPDATE no action ON DELETE no action
);
