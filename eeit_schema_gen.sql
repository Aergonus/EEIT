-- DROP SCHEMA IF EXISTS `EEIT`;

CREATE SCHEMA IF NOT EXISTS `EEIT` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `EEIT` ;

-- -----------------------------------------------------
-- Table `EEIT`.`Users`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Users` (
  `uid` INT NOT NULL AUTO_INCREMENT, -- user id
  `user` VARCHAR(20) NOT NULL UNIQUE , -- username
  `pass` VARCHAR(60) NOT NULL , -- password using bcrypt results in 60 char hashes
  `utype` ENUM('student', 'teacher', 'technician', 'removed') NOT NULL , -- user type
  `sid` CHAR(10) NOT NULL , -- school id
  `fname` VARCHAR(20) NOT NULL , -- first name
  `lname` VARCHAR(20) NOT NULL , -- last name
  `phone` CHAR(10) NULL , -- phone number
  `email` VARCHAR(320) NOT NULL UNIQUE , -- email address
  `regtime` DATETIME NOT NULL, -- register time
  PRIMARY KEY (`uid`) )
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`Requests`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Requests` (
  `rid` INT NOT NULL AUTO_INCREMENT, -- requests id
  `uid` INT NOT NULL , -- foreign key on uid 
  `rflag` ENUM('approved', 'rejected', 'pending') NOT NULL ,
  `rdata` VARCHAR(500) NOT NULL , -- request data
  PRIMARY KEY (`rid`) , 
  INDEX `Requests_index_uid` (`uid` ASC) ,
  CONSTRAINT `FK_uid_requests`
    FOREIGN KEY (`uid` )
    REFERENCES `EEIT`.`Users` (`uid` )
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`EquipmentTypes`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`EquipmentTypes` (
  `etid` INT NOT NULL AUTO_INCREMENT, -- equipment type id
  `name` VARCHAR(100) NOT NULL ,
  `hv` BIT NOT NULL , -- True or False High Value
  `cat` INT NOT NULL ,
  `desc` VARCHAR(200) NULL ,
  `datasheet` VARCHAR(255) NULL ,
  PRIMARY KEY (`etid`) )
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`Locations`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Locations` (
  `lid` INT NOT NULL AUTO_INCREMENT, -- location id
  `name` VARCHAR(20) NOT NULL ,
  `room` CHAR(5) NOT NULL ,
  `desc` VARCHAR(200) NULL ,
  PRIMARY KEY (`lid`) )
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`Equipment`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Equipment` (
  `eid` INT NOT NULL AUTO_INCREMENT, -- equipment id
  `etid` INT NOT NULL ,
  `lid` INT NOT NULL ,
  `ino` INT NOT NULL , -- item number
  PRIMARY KEY (`eid`) ,
  INDEX `Equipment_index_lid` (`lid` ASC) ,
  INDEX `Equipment_index_etid` (`etid` ASC) ,
  CONSTRAINT `FK_etid_equipment`
    FOREIGN KEY (`etid` )
    REFERENCES `EEIT`.`EquipmentTypes` (`etid` )
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `FK_lid_equipment`
    FOREIGN KEY (`lid` )
    REFERENCES `EEIT`.`Locations` (`lid` )
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`StatusReports`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`StatusReports` (
  `sid` INT NOT NULL AUTO_INCREMENT, -- status report id
  `uid` INT NOT NULL ,
  `eid` INT NOT NULL ,
  `status` ENUM('available', 'borrowed', 'out', 'low', 'broken', 'backup') NOT NULL ,
  `srtime` DATETIME , -- entered time
  `approved` BIT NOT NULL ,
  PRIMARY KEY (`sid`) ,
  INDEX `StatusReports_index_eid` (`eid` ASC) ,
  INDEX `StatusReports_index_uid` (`uid` ASC) ,
  CONSTRAINT `FK_eid_statusreports`
    FOREIGN KEY (`eid` )
    REFERENCES `EEIT`.`Equipment` (`eid` )
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `FK_uid_statusreports`
    FOREIGN KEY (`uid` )
    REFERENCES `EEIT`.`Users` (`uid` )
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`Kits`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`Kits` (
  `kid` INT NOT NULL AUTO_INCREMENT, -- kit id
  `uid` INT NOT NULL ,
  `name` VARCHAR(50) NOT NULL ,
  `desc` VARCHAR(200) NULL ,
  PRIMARY KEY (`kid`) ,
  INDEX `Kits_index_uid` (`uid` ASC) ,
  CONSTRAINT `FK_uid_kits`
    FOREIGN KEY (`uid` )
    REFERENCES `EEIT`.`Users` (`uid` )
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `EEIT`.`KitEntries`
-- -----------------------------------------------------
CREATE  TABLE IF NOT EXISTS `EEIT`.`KitEntries` (
  `kid` INT NOT NULL AUTO_INCREMENT,
  `etid` INT NOT NULL ,
  `quantity` INT NOT NULL ,
  INDEX `KitEntries_index_kid` (`kid` ASC) ,
  PRIMARY KEY (`kid`, `etid`) ,
  CONSTRAINT `FK_kid_kitentries`
    FOREIGN KEY (`kid` )
    REFERENCES `EEIT`.`Kits` (`kid` )
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `FK_etid_kitentries`
    FOREIGN KEY (`etid` )
    REFERENCES `EEIT`.`EquipmentTypes` (`etid` )
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

DELIMITER $$
CREATE PROCEDURE Reg(IN newuser varchar(20), IN bcryptedhash varchar(60),
					 IN in_sid CHAR(10), IN in_fname VARCHAR(20), IN in_lname VARCHAR(20),
                     IN in_phone CHAR(10), IN in_email VARCHAR(320))
BEGIN
INSERT INTO Users (`user`, `pass`, `utype`, `sid`, `fname`, `lname`, `phone`, `email`, `regtime`)
	VALUES
    (newuser, bcryptedhash, 'student', in_sid, in_fname, in_lname, in_phone, in_email, NOW());
END;

CREATE PROCEDURE Val(IN loginuser varchar(50))
BEGIN
SELECT `pass` FROM Users WHERE `user` = loginuser; -- Add email login too?
END;

