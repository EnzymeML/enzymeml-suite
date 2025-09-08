-- Your SQL goes here
CREATE TABLE `vessels`(
	`id` INTEGER NOT NULL PRIMARY KEY,
	`name` VARCHAR NOT NULL UNIQUE,
	`volume` FLOAT8 NOT NULL,
	`unit` VARCHAR NOT NULL,
	`constant` BOOL NOT NULL
);

CREATE TABLE `creators`(
	`id` INTEGER NOT NULL PRIMARY KEY,
	`given_name` VARCHAR NOT NULL,
	`family_name` VARCHAR NOT NULL,
	`mail` VARCHAR NOT NULL
);

CREATE TABLE `documents`(
	`id` INTEGER NOT NULL PRIMARY KEY,
	`title` VARCHAR NOT NULL,
	`content` TEXT NOT NULL
);

CREATE TABLE `small_molecules`(
	`id` INTEGER NOT NULL PRIMARY KEY,
	`name` VARCHAR NOT NULL UNIQUE,
	`canonical_smiles` TEXT,
	`inchi` TEXT,
	`inchikey` VARCHAR,
	`references` TEXT
);

CREATE TABLE `proteins`(
	`id` INTEGER NOT NULL PRIMARY KEY,
	`name` VARCHAR NOT NULL UNIQUE,
	`sequence` TEXT,
	`ecnumber` VARCHAR,
	`organism` VARCHAR,
	`organism_tax_id` VARCHAR
);

