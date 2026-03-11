CREATE TABLE `banners` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`description` text,
	`image_url` varchar(2048) NOT NULL,
	`public_id` varchar(255) NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`is_featured` boolean DEFAULT false,
	`image_url` varchar(2048),
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
	`discount_percent` int DEFAULT 0,
	`is_featured` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drugs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `homepage_sections` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`category_id` int,
	`display_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `homepage_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`drug_id` int,
	`product_name` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`customer_name` varchar(255) NOT NULL,
	`customer_email` varchar(255) NOT NULL,
	`customer_phone` varchar(50) NOT NULL,
	`delivery_address` text NOT NULL,
	`total_amount` decimal(10,2) NOT NULL,
	`paystack_reference` varchar(100) NOT NULL,
	`status` varchar(50) DEFAULT 'paid',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_paystack_reference_unique` UNIQUE(`paystack_reference`)
);
--> statement-breakpoint
CREATE TABLE `section_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`section_id` int NOT NULL,
	`drug_id` int NOT NULL,
	`display_order` int DEFAULT 0,
	CONSTRAINT `section_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_applications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`address` text NOT NULL,
	`education_level` varchar(100),
	`motivation` text NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `training_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`password` varchar(255),
	`google_id` varchar(255),
	`role` varchar(20) DEFAULT 'user',
	`otp` varchar(6),
	`otp_expires_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_google_id_unique` UNIQUE(`google_id`)
);
