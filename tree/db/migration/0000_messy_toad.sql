CREATE TABLE `categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `drugs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`active_ingredient` varchar(255),
	`tags` text,
	`volume` varchar(100),
	`image_url` varchar(2048),
	`retail_price` decimal(10,2) NOT NULL,
	`cost_price` decimal(10,2),
	`stock` int NOT NULL DEFAULT 0,
	`expiry_date` timestamp,
	`is_prescription_required` boolean DEFAULT false,
	`category_id` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drugs_id` PRIMARY KEY(`id`)
);
