SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

CREATE SCHEMA IF NOT EXISTS `EEIT` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `EEIT` ;

-- -----------------------------------------------------
-- Table `EEIT`.`Users`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Users` (
  `user_id` INT NOT NULL ,
  `username` VARCHAR(20) NOT NULL ,
  `password` VARCHAR(20) NOT NULL ,
  `user_type` ENUM('student', 'teacher', 'technician', 'removed') NOT NULL ,
  `school_id` CHAR(10) NOT NULL ,
  `first_name` VARCHAR(20) NOT NULL ,
  `last_name` VARCHAR(20) NOT NULL ,
  `phone_no` CHAR(10) NULL ,
  `email` VARCHAR(320) NULL ,
  PRIMARY KEY (`user_id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `EEIT`.`Requests`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Requests` (
  `req_id` INT NOT NULL ,
  `user_id` INT NOT NULL ,
  `flag` ENUM('approved', 'rejected', 'pending') NOT NULL ,
  `req_data` VARCHAR(500) NOT NULL ,
  PRIMARY KEY (`req_id`) ,
  INDEX `User_idx` (`user_id` ASC) ,
  CONSTRAINT `User`
    FOREIGN KEY (`user_id` )
    REFERENCES `EEIT`.`Users` (`user_id` )
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;
-- -----------------------------------------------------
-- Table `EEIT`.`Kits`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Kits` (
  `kit_id` INT NOT NULL ,
  `user_id` INT NOT NULL ,
  `name` VARCHAR(50) NOT NULL ,
  `description` VARCHAR(200) NULL ,
  PRIMARY KEY (`kit_id`) ,
  INDEX `User_idx` (`user_id` ASC) ,
  CONSTRAINT `User`
    FOREIGN KEY (`user_id` )
    REFERENCES `EEIT`.`Users` (`user_id` )
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `EEIT`.`EquipmentTypes`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`EquipmentTypes` (
  `etype_id` INT NOT NULL ,
  `name` VARCHAR(100) NOT NULL ,
  `is_high_value` BIT NOT NULL ,
  `category` INT NOT NULL ,
  `description` VARCHAR(200) NULL ,
  `datasheet` VARCHAR(255) NULL ,
  PRIMARY KEY (`etype_id`) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `EEIT`.`Locations`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Locations` (
  `location_id` INT NOT NULL ,
  `name` VARCHAR(20) NOT NULL ,
  `room` CHAR(5) NOT NULL ,
  `description` VARCHAR(200) NULL ,
  PRIMARY KEY (`location_id`) )
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`Equipment`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Equipment` (
  `equip_id` INT NOT NULL ,
  `etype_id` INT NOT NULL ,
  `location_id` INT NOT NULL ,
  `item_no` INT NOT NULL ,
  PRIMARY KEY (`equip_id`) ,
  INDEX `location_id_idx` (`location_id` ASC) ,
  INDEX `etype_id_idx` (`etype_id` ASC) ,
  CONSTRAINT `EquipmentType`
    FOREIGN KEY (`etype_id` )
    REFERENCES `EEIT`.`EquipmentTypes` (`etype_id` )
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `Location`
    FOREIGN KEY (`location_id` )
    REFERENCES `EEIT`.`Locations` (`location_id` )
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `EEIT`.`StatusReports`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`StatusReports` (
  `status_id` INT NOT NULL ,
  `user_id` INT NOT NULL ,
  `equip_id` INT NOT NULL ,
  `status` ENUM('available', 'borrowed', 'out', 'low', 'broken', 'backup') NOT NULL ,
  `entered_time` CHAR(20) NOT NULL ,
  `approved` BIT NOT NULL ,
  PRIMARY KEY (`status_id`) ,
  INDEX `Equipment_idx` (`equip_id` ASC) ,
  INDEX `User_idx` (`user_id` ASC) ,
  CONSTRAINT `Equipment`
    FOREIGN KEY (`equip_id` )
    REFERENCES `EEIT`.`Equipment` (`equip_id` )
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `User`
    FOREIGN KEY (`user_id` )
    REFERENCES `EEIT`.`Users` (`user_id` )
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `EEIT`.`KitEntries`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`KitEntries` (
  `kit_id` INT NOT NULL ,
  `etype_id` INT NOT NULL ,
  `quantity` INT NOT NULL ,
  INDEX `Kit_idx` (`kit_id` ASC) ,
  INDEX `EquipmentType_idx` (`etype_id` ASC) ,
  PRIMARY KEY (`kit_id`, `etype_id`) ,
  CONSTRAINT `Kit`
    FOREIGN KEY (`kit_id` )
    REFERENCES `EEIT`.`Kits` (`kit_id` )
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `EquipmentType`
    FOREIGN KEY (`etype_id` )
    REFERENCES `EEIT`.`EquipmentTypes` (`etype_id` )
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

USE `EEIT` ;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
