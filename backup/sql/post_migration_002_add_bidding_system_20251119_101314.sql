mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: glamgo
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
mysqldump: Error: 'Access denied; you need (at least one of) the PROCESS privilege(s) for this operation' when trying to dump tablespaces

--
-- Table structure for table `bids`
--

DROP TABLE IF EXISTS `bids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bids` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT 'Commande concernÃ©e',
  `provider_id` int NOT NULL COMMENT 'Prestataire qui fait l''offre',
  `proposed_price` decimal(10,2) NOT NULL COMMENT 'Prix proposÃ© par le prestataire',
  `estimated_arrival_minutes` int DEFAULT NULL COMMENT 'Temps d''arrivÃ©e estimÃ© en minutes',
  `message` text COLLATE utf8mb4_unicode_ci COMMENT 'Message/justification du prestataire',
  `status` enum('pending','accepted','rejected','withdrawn','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_order` (`provider_id`,`order_id`),
  KEY `idx_order_status` (`order_id`,`status`),
  KEY `idx_provider_status` (`provider_id`,`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `bids_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bids_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Offres des prestataires pour les commandes en mode enchÃ¨res';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bids`
--

LOCK TABLES `bids` WRITE;
/*!40000 ALTER TABLE `bids` DISABLE KEYS */;
/*!40000 ALTER TABLE `bids` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` int DEFAULT NULL COMMENT 'Pour les sous-catÃ©gories',
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'BeautÃ©','beaute','Services de beautÃ© et bien-Ãªtre','beauty.svg',NULL,1,1,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(2,'Maison','maison','Services pour la maison','home.svg',NULL,1,2,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(3,'Voiture','voiture','Services pour votre vÃ©hicule','car.svg',NULL,1,3,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(4,'Animaux','animaux','Services pour vos animaux de compagnie','pet.svg',NULL,1,4,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(5,'Bien-Ãªtre','bien-etre','Services de bien-Ãªtre et relaxation','wellness.svg',NULL,1,5,'2025-11-14 14:38:30','2025-11-17 14:40:38'),(6,'EsthÃ©tique','esthetique','Soins du visage et du corps','face.svg',1,1,2,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(7,'Manucure & PÃ©dicure','manucure-pedicure','Soins des mains et des pieds','nails.svg',1,1,3,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(8,'Massage','massage','Massages relaxants et thÃ©rapeutiques','massage.svg',1,1,4,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(9,'Animal','animal','Services pour vos animaux de compagnie','pet.svg',2,1,1,'2025-11-14 14:38:30','2025-11-17 14:37:46'),(10,'Plomberie','plomberie','RÃ©parations et installations','plumbing.svg',2,1,2,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(11,'Ã‰lectricitÃ©','electricite','Installations et dÃ©pannages Ã©lectriques','electric.svg',2,1,3,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(12,'Jardinage','jardinage','Entretien d\'espaces verts','garden.svg',2,1,4,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(13,'Lavage','lavage','Lavage intÃ©rieur et extÃ©rieur','car-wash.svg',3,1,1,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(14,'MÃ©canique','mecanique','RÃ©parations mÃ©caniques','mechanic.svg',3,1,2,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(15,'Toilettage','toilettage','Toilettage et soins','pet-grooming.svg',4,1,1,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(16,'VÃ©tÃ©rinaire','veterinaire','Soins vÃ©tÃ©rinaires Ã  domicile','vet.svg',4,1,2,'2025-11-14 14:38:30','2025-11-14 14:38:30'),(19,'Ménage','menage','Services de nettoyage et entretien','clean.svg',2,1,1,'2025-11-18 08:11:15','2025-11-18 08:11:15'),(20,'Bricolage','bricolage','Petits travaux et réparations','tools.svg',2,1,2,'2025-11-18 08:11:15','2025-11-18 08:11:15'),(21,'Cuisine','cuisine-domicile','Services de chef à domicile','chef.svg',2,1,4,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(22,'Coiffure Homme','coiffure-homme','Coupes et soins capillaires masculins','hair-man.svg',1,1,1,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(23,'Coiffure Femme','coiffure-femme','Coupes et soins capillaires féminins','hair-woman.svg',1,1,2,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(24,'Maquillage','maquillage','Maquillage professionnel','makeup.svg',1,1,3,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(25,'Épilation Femme','epilation-femme','Épilation féminine','wax-woman.svg',1,1,5,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(26,'Épilation Homme','epilation-homme','Épilation masculine','wax-man.svg',1,1,6,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(27,'Mécanique','mecanique-domicile','Réparations mécaniques à domicile','mechanic.svg',3,1,1,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(28,'Lavage','lavage-auto','Nettoyage intérieur et extérieur','car-wash.svg',3,1,2,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(29,'Coaching','coaching','Coaching sportif et bien-être','coach.svg',5,1,2,'2025-11-18 08:11:16','2025-11-18 08:11:16'),(30,'Soins Animaux','soins-animaux','Toilettage et soins pour animaux','pet-grooming.svg',4,1,1,'2025-11-18 08:11:16','2025-11-18 08:11:16');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_tracking`
--

DROP TABLE IF EXISTS `location_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_tracking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `provider_id` int NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `provider_id` (`provider_id`),
  KEY `idx_order_id` (`order_id`),
  CONSTRAINT `location_tracking_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `location_tracking_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_tracking`
--

LOCK TABLES `location_tracking` WRITE;
/*!40000 ALTER TABLE `location_tracking` DISABLE KEYS */;
INSERT INTO `location_tracking` VALUES (20,13,7,31.63026091,-7.98366229,'2025-11-18 15:12:26'),(21,13,7,31.62580932,-7.98244687,'2025-11-18 15:12:31'),(22,13,7,31.62886818,-7.98128157,'2025-11-18 15:12:36'),(23,13,7,31.62841571,-7.98276015,'2025-11-18 15:12:39'),(24,13,7,31.63448389,-7.98520709,'2025-11-18 15:12:44'),(25,13,7,31.62935194,-7.98010560,'2025-11-18 15:12:50');
/*!40000 ALTER TABLE `location_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `sender_type` enum('user','provider') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `translated_content` text COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,3,'provider',2,'Je suis en route','أنا في الطريق',0,'2025-11-16 20:32:46'),(2,5,'user',8,'Où êtes-vous ?','أين أنت؟',1,'2025-11-16 20:37:45'),(3,5,'provider',2,'J\'arrive dans 5 minutes','سأصل قريبا dans 5 دقائق',1,'2025-11-16 20:38:52'),(4,5,'user',8,'D\'accord','حسنا',0,'2025-11-16 20:40:39'),(5,5,'user',8,'D\'accord','حسنا',0,'2025-11-16 20:41:31'),(6,6,'provider',2,'Je suis en route','أنا في الطريق',1,'2025-11-16 21:02:48'),(7,7,'provider',2,'Je suis en route','أنا في الطريق',1,'2025-11-16 22:46:19'),(8,7,'user',8,'D\'accord','حسنا',0,'2025-11-16 22:48:01'),(9,8,'provider',5,'Je suis en route','أنا في الطريق',1,'2025-11-18 08:04:30'),(10,8,'user',11,'Je vous attends','أنتظرك',0,'2025-11-18 08:07:12'),(11,10,'provider',5,'Je suis en route','أنا في الطريق',1,'2025-11-18 13:21:39'),(12,13,'provider',7,'Je suis en route','أنا في الطريق',1,'2025-11-18 15:07:07'),(13,13,'user',12,'D\'accord','حسنا',0,'2025-11-18 15:14:36');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `negotiations`
--

DROP TABLE IF EXISTS `negotiations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `negotiations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bid_id` int NOT NULL COMMENT 'Offre concernÃ©e',
  `order_id` int NOT NULL COMMENT 'Commande concernÃ©e',
  `actor_type` enum('user','provider') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Qui a fait l''action',
  `actor_id` int NOT NULL COMMENT 'ID de l''acteur',
  `action_type` enum('counter_offer','message','price_adjustment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_price` decimal(10,2) DEFAULT NULL COMMENT 'Prix prÃ©cÃ©dent',
  `new_price` decimal(10,2) DEFAULT NULL COMMENT 'Nouveau prix proposÃ©',
  `message` text COLLATE utf8mb4_unicode_ci COMMENT 'Message accompagnant l''action',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bid_id` (`bid_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `negotiations_ibfk_1` FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`) ON DELETE CASCADE,
  CONSTRAINT `negotiations_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Historique des nÃ©gociations entre utilisateurs et prestataires';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `negotiations`
--

LOCK TABLES `negotiations` WRITE;
/*!40000 ALTER TABLE `negotiations` DISABLE KEYS */;
/*!40000 ALTER TABLE `negotiations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('user','provider') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `notification_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recipient` (`recipient_type`,`recipient_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_notification_type` (`notification_type`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (4,'user',2,4,'order_accepted','Commande acceptée','Votre commande #4 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 4}',0,NULL,'2025-11-16 20:03:20','2025-11-16 20:03:20'),(5,'user',2,4,'order_on_way','Prestataire en route','Le prestataire est en route pour votre commande #4.','{\"status\": \"on_way\", \"order_id\": 4}',0,NULL,'2025-11-16 20:05:50','2025-11-16 20:05:50'),(9,'user',8,5,'order_accepted','Commande acceptée','Votre commande #5 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 5}',1,'2025-11-16 20:12:04','2025-11-16 20:11:22','2025-11-16 20:12:04'),(10,'user',8,5,'order_on_way','Prestataire en route','Le prestataire est en route pour votre commande #5.','{\"status\": \"on_way\", \"order_id\": 5}',1,'2025-11-16 20:35:14','2025-11-16 20:13:20','2025-11-16 20:35:14'),(11,'user',4,3,'order_accepted','Commande acceptée','Votre commande #3 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 3}',0,NULL,'2025-11-16 20:32:13','2025-11-16 20:32:13'),(15,'user',8,6,'order_accepted','Commande acceptée','Votre commande #6 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 6}',1,'2025-11-16 21:17:03','2025-11-16 21:02:30','2025-11-16 21:17:03'),(16,'user',8,6,'order_on_way','Prestataire en route','Le prestataire est en route pour votre commande #6.','{\"status\": \"on_way\", \"order_id\": 6}',1,'2025-11-16 21:16:59','2025-11-16 21:02:53','2025-11-16 21:16:59'),(17,'user',8,6,'order_completed','Service terminé','Votre commande #6 est terminée. Merci de votre confiance !','{\"status\": \"completed\", \"order_id\": 6}',1,'2025-11-16 22:14:09','2025-11-16 21:22:09','2025-11-16 22:14:09'),(18,'user',8,5,'order_completed','Service terminé','Votre commande #5 est terminée. Merci de votre confiance !','{\"status\": \"completed\", \"order_id\": 5}',1,'2025-11-16 22:14:06','2025-11-16 21:26:35','2025-11-16 22:14:06'),(22,'user',8,7,'order_accepted','Commande acceptée','Votre commande #7 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 7}',0,NULL,'2025-11-16 22:45:49','2025-11-16 22:45:49'),(23,'user',8,7,'order_on_way','Prestataire en route','Le prestataire est en route pour votre commande #7.','{\"status\": \"on_way\", \"order_id\": 7}',0,NULL,'2025-11-16 22:46:33','2025-11-16 22:46:33'),(24,'user',8,7,'order_completed','Service terminé','Votre commande #7 est terminée. Merci de votre confiance !','{\"status\": \"completed\", \"order_id\": 7}',0,NULL,'2025-11-16 22:49:03','2025-11-16 22:49:03'),(28,'user',11,8,'order_accepted','Commande acceptée','Votre commande #8 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 8}',0,NULL,'2025-11-18 08:04:07','2025-11-18 08:04:07'),(29,'user',11,8,'order_on_way','Prestataire en route','Le prestataire est en route pour votre commande #8.','{\"status\": \"on_way\", \"order_id\": 8}',0,NULL,'2025-11-18 08:04:38','2025-11-18 08:04:38'),(36,'user',11,8,'order_completed','Service terminé','Votre commande #8 est terminée. Merci de votre confiance !','{\"status\": \"completed\", \"order_id\": 8}',0,NULL,'2025-11-18 11:35:49','2025-11-18 11:35:49'),(40,'user',11,10,'order_accepted','Commande acceptée','Votre commande #10 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 10}',0,NULL,'2025-11-18 13:21:16','2025-11-18 13:21:16'),(41,'provider',7,NULL,'new_order','Nouvelle commande disponible','Une nouvelle commande pour Coiffure homme est disponible.',NULL,0,NULL,'2025-11-18 13:41:02','2025-11-18 13:41:02'),(42,'provider',7,NULL,'new_order','Nouvelle commande disponible','Une nouvelle commande pour Soin barbe est disponible.',NULL,0,NULL,'2025-11-18 13:41:02','2025-11-18 13:41:02'),(43,'provider',7,NULL,'new_message','Nouveau message','Vous avez recu un nouveau message d un client.',NULL,0,NULL,'2025-11-18 13:41:02','2025-11-18 13:41:02'),(44,'provider',7,NULL,'new_order','Nouvelle commande disponible','Une nouvelle commande pour Coupe classique homme est disponible.',NULL,0,NULL,'2025-11-18 13:41:02','2025-11-18 13:41:02'),(45,'provider',7,NULL,'new_order','Nouvelle commande disponible','Une nouvelle commande pour Nettoyage voiture est disponible.',NULL,0,NULL,'2025-11-18 13:41:02','2025-11-18 13:41:02'),(46,'provider',7,12,'new_order','Nouvelle commande disponible','Une nouvelle commande pour Barbe et contours est disponible.','{\"order_id\": 12, \"scheduled_at\": \"2025-11-23 12:00:00\", \"service_name\": \"Barbe et contours\"}',1,'2025-11-18 14:04:30','2025-11-18 13:49:57','2025-11-18 14:04:30'),(47,'provider',7,13,'new_order','Nouvelle commande disponible','Une nouvelle commande pour Rasage à l\'ancienne est disponible.','{\"order_id\": 13, \"scheduled_at\": \"2025-11-22 15:00:00\", \"service_name\": \"Rasage à l\'ancienne\"}',0,NULL,'2025-11-18 15:02:08','2025-11-18 15:02:08'),(48,'user',12,13,'order_accepted','Commande acceptée','Votre commande #13 a été acceptée par un prestataire.','{\"status\": \"accepted\", \"order_id\": 13}',0,NULL,'2025-11-18 15:06:37','2025-11-18 15:06:37'),(49,'user',12,13,'order_on_way','Prestataire en route','Le prestataire est en route pour votre commande #13.','{\"status\": \"on_way\", \"order_id\": 13}',0,NULL,'2025-11-18 15:12:12','2025-11-18 15:12:12'),(50,'user',12,13,'order_completed','Service terminé','Votre commande #13 est terminée. Merci de votre confiance !','{\"status\": \"completed\", \"order_id\": 13}',1,'2025-11-18 15:44:02','2025-11-18 15:16:16','2025-11-18 15:44:02');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oauth_providers`
--

DROP TABLE IF EXISTS `oauth_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_providers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'google, facebook',
  `provider_user_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token` text COLLATE utf8mb4_unicode_ci,
  `refresh_token` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_user` (`provider`,`provider_user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `oauth_providers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oauth_providers`
--

LOCK TABLES `oauth_providers` WRITE;
/*!40000 ALTER TABLE `oauth_providers` DISABLE KEYS */;
/*!40000 ALTER TABLE `oauth_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `provider_id` int DEFAULT NULL,
  `service_id` int NOT NULL,
  `address_id` int NOT NULL,
  `status` enum('pending','accepted','on_way','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `pricing_mode` enum('fixed','bidding') COLLATE utf8mb4_unicode_ci DEFAULT 'fixed' COMMENT 'Mode de tarification',
  `user_proposed_price` decimal(10,2) DEFAULT NULL COMMENT 'Budget proposÃ© en mode enchÃ¨res',
  `accepted_bid_id` int DEFAULT NULL COMMENT 'ID offre acceptÃ©e',
  `bid_expiry_time` timestamp NULL DEFAULT NULL COMMENT 'Expiration des offres',
  `scheduled_at` datetime DEFAULT NULL COMMENT 'NULL = maintenant',
  `accepted_at` datetime DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `tip` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','paid','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `has_review` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `address_id` (`address_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `fk_orders_accepted_bid` (`accepted_bid_id`),
  KEY `idx_pricing_mode_status` (`pricing_mode`,`status`),
  CONSTRAINT `fk_orders_accepted_bid` FOREIGN KEY (`accepted_bid_id`) REFERENCES `bids` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`address_id`) REFERENCES `user_addresses` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,4,NULL,3,1,'cancelled','fixed',NULL,NULL,NULL,'2025-11-28 10:00:00',NULL,NULL,NULL,100.00,0.00,100.00,'pending',NULL,'rapide et efficace',NULL,'2025-11-16 18:45:27','2025-11-16 19:53:03',0),(3,4,NULL,26,2,'accepted','fixed',NULL,NULL,NULL,'2025-11-23 10:00:00','2025-11-16 20:32:13',NULL,NULL,150.00,0.00,150.00,'pending',NULL,'efficace',NULL,'2025-11-16 19:51:27','2025-11-16 20:32:13',0),(4,2,NULL,31,3,'on_way','fixed',NULL,NULL,NULL,'2025-11-28 15:00:00','2025-11-16 20:03:20',NULL,NULL,200.00,0.00,200.00,'pending',NULL,'efficace',NULL,'2025-11-16 20:01:08','2025-11-16 20:05:50',0),(5,8,NULL,20,4,'completed','fixed',NULL,NULL,NULL,'2025-11-30 14:00:00','2025-11-16 20:11:22',NULL,'2025-11-16 21:26:35',300.00,0.00,300.00,'pending',NULL,'efficace!',NULL,'2025-11-16 20:09:29','2025-11-16 21:26:35',0),(6,8,NULL,1,5,'completed','fixed',NULL,NULL,NULL,'2025-11-22 11:00:00','2025-11-16 21:02:30',NULL,'2025-11-16 21:22:09',80.00,0.00,80.00,'pending',NULL,'rapide',NULL,'2025-11-16 21:01:34','2025-11-16 21:51:38',1),(7,8,NULL,32,6,'completed','fixed',NULL,NULL,NULL,'2025-11-22 15:00:00','2025-11-16 22:45:49',NULL,'2025-11-16 22:49:03',100.00,0.00,100.00,'pending',NULL,'efficace',NULL,'2025-11-16 21:32:23','2025-11-16 22:49:47',1),(8,11,NULL,26,7,'completed','fixed',NULL,NULL,NULL,'2025-11-22 12:00:00','2025-11-18 08:04:07',NULL,'2025-11-18 11:35:49',150.00,0.00,150.00,'pending',NULL,'efficace',NULL,'2025-11-18 08:02:12','2025-11-18 11:35:49',0),(9,11,NULL,57,8,'pending','fixed',NULL,NULL,NULL,'2025-11-23 11:00:00',NULL,NULL,NULL,150.00,0.00,150.00,'pending',NULL,'efficace',NULL,'2025-11-18 11:17:34','2025-11-18 11:17:34',0),(10,11,NULL,57,9,'accepted','fixed',NULL,NULL,NULL,'2025-11-28 17:00:00','2025-11-18 13:21:16',NULL,NULL,150.00,0.00,150.00,'pending',NULL,'efficace',NULL,'2025-11-18 11:21:28','2025-11-18 13:21:16',0),(11,11,NULL,61,11,'pending','fixed',NULL,NULL,NULL,'2025-11-30 10:00:00',NULL,NULL,NULL,450.00,0.00,450.00,'pending',NULL,'',NULL,'2025-11-18 12:35:34','2025-11-18 12:35:34',0),(12,12,NULL,55,12,'pending','fixed',NULL,NULL,NULL,'2025-11-23 12:00:00',NULL,NULL,NULL,125.00,0.00,125.00,'pending',NULL,'efficace',NULL,'2025-11-18 13:49:57','2025-11-18 13:49:57',0),(13,12,7,56,13,'completed','fixed',NULL,NULL,NULL,'2025-11-22 15:00:00','2025-11-18 15:06:37',NULL,'2025-11-18 15:16:15',175.00,0.00,175.00,'pending',NULL,'je prefere par une femme',NULL,'2025-11-18 15:02:08','2025-11-18 15:17:50',1);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_services`
--

DROP TABLE IF EXISTS `provider_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `provider_id` int NOT NULL,
  `service_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_provider_service` (`provider_id`,`service_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `provider_services_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `provider_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_services`
--

LOCK TABLES `provider_services` WRITE;
/*!40000 ALTER TABLE `provider_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `provider_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provider_stats`
--

DROP TABLE IF EXISTS `provider_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provider_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `provider_id` int NOT NULL,
  `total_bids` int DEFAULT '0' COMMENT 'Nombre total d''offres faites',
  `accepted_bids` int DEFAULT '0' COMMENT 'Nombre d''offres acceptÃ©es',
  `rejected_bids` int DEFAULT '0' COMMENT 'Nombre d''offres rejetÃ©es',
  `withdrawn_bids` int DEFAULT '0' COMMENT 'Nombre d''offres retirÃ©es',
  `expired_bids` int DEFAULT '0' COMMENT 'Nombre d''offres expirÃ©es',
  `acceptance_rate` decimal(5,2) DEFAULT '0.00' COMMENT 'Taux d''acceptation en %',
  `avg_response_time_minutes` int DEFAULT '0' COMMENT 'Temps moyen de rÃ©ponse en minutes',
  `avg_bid_price` decimal(10,2) DEFAULT '0.00' COMMENT 'Prix moyen des offres',
  `lowest_bid_price` decimal(10,2) DEFAULT NULL COMMENT 'Offre la plus basse',
  `highest_bid_price` decimal(10,2) DEFAULT NULL COMMENT 'Offre la plus haute',
  `last_bid_at` timestamp NULL DEFAULT NULL COMMENT 'Date de la derniÃ¨re offre',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `provider_id` (`provider_id`),
  KEY `idx_acceptance_rate` (`acceptance_rate`),
  KEY `idx_last_bid_at` (`last_bid_at`),
  CONSTRAINT `provider_stats_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Statistiques des prestataires pour le systÃ¨me d''enchÃ¨res';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provider_stats`
--

LOCK TABLES `provider_stats` WRITE;
/*!40000 ALTER TABLE `provider_stats` DISABLE KEYS */;
INSERT INTO `provider_stats` VALUES (1,8,0,0,0,0,0,0.00,0,0.00,NULL,NULL,NULL,'2025-11-19 08:01:45','2025-11-19 08:01:45'),(2,9,0,0,0,0,0,0.00,0,0.00,NULL,NULL,NULL,'2025-11-19 08:01:45','2025-11-19 08:01:45'),(3,7,0,0,0,0,0,0.00,0,0.00,NULL,NULL,NULL,'2025-11-19 08:01:45','2025-11-19 08:01:45');
/*!40000 ALTER TABLE `provider_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `providers`
--

DROP TABLE IF EXISTS `providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `providers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_available` tinyint(1) DEFAULT '1',
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_location` (`current_latitude`,`current_longitude`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `providers`
--

LOCK TABLES `providers` WRITE;
/*!40000 ALTER TABLE `providers` DISABLE KEYS */;
INSERT INTO `providers` VALUES (7,'jeanmarc@glamgo.com','$2y$10$yY9SOZNWV184Ayo9gER/eum/1G5VuqP6fDDDvqpHVBbHhmH8CS7EC','Jean-Marc','Dupont','0612345678',NULL,1,1,31.62935194,-7.98010560,4.00,0,'2025-11-18 13:41:02','2025-11-18 15:17:50'),(8,'m.bi1234@hotmail.fr','$2y$12$gT/Dy9hszj3WhB4hFaSMSu/UYuwrZBoN.AA9BnZBeNc.MaSVEncxy','Jean-Marc','DURAND','0612345678',NULL,0,0,NULL,NULL,0.00,0,'2025-11-18 13:53:05','2025-11-18 13:53:05'),(9,'m.bi74@hotmail.fr','$2y$12$lx0HUzdNaK0q9H6pnTNQhek8udqNTHskAO3obbtVf.TuLzRIyNlvS','Baptiste','Faye','0612345678',NULL,0,0,NULL,NULL,0.00,0,'2025-11-18 13:54:58','2025-11-18 13:54:58');
/*!40000 ALTER TABLE `providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `user_id` int NOT NULL,
  `provider_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `service_quality` tinyint DEFAULT NULL,
  `punctuality` tinyint DEFAULT NULL,
  `professionalism` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_review` (`order_id`),
  KEY `user_id` (`user_id`),
  KEY `provider_id` (`provider_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (3,13,12,7,4,'tres satifait','2025-11-18 15:17:50','2025-11-18 15:17:50',4,4,4);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` int NOT NULL COMMENT 'DurÃ©e estimÃ©e en minutes',
  `is_active` tinyint(1) DEFAULT '1',
  `allow_bidding` tinyint(1) DEFAULT '1' COMMENT 'Autoriser enchÃ¨res',
  `min_suggested_price` decimal(10,2) DEFAULT NULL COMMENT 'Prix min suggÃ©rÃ©',
  `max_suggested_price` decimal(10,2) DEFAULT NULL COMMENT 'Prix max suggÃ©rÃ©',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_slug` (`slug`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,5,'Coupe Homme','coupe-homme','Coupe de cheveux classique pour homme','https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=600&fit=crop',80.00,30,1,1,64.00,96.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(2,5,'Coupe Femme','coupe-femme','Coupe de cheveux pour femme','https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',120.00,45,1,1,96.00,144.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(3,5,'Brushing','brushing','Brushing professionnel','https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&h=600&fit=crop',100.00,40,1,1,80.00,120.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(4,5,'Coloration','coloration','Coloration complÃ¨te','https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop',250.00,120,1,1,200.00,300.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(5,5,'MÃ¨ches','meches','MÃ¨ches ou balayage','https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&h=600&fit=crop',300.00,150,1,1,240.00,360.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(6,6,'Soin du visage','soin-visage','Soin complet du visage','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop',200.00,60,1,1,160.00,240.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(7,6,'Ã‰pilation jambes','epilation-jambes','Ã‰pilation complÃ¨te des jambes','https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=600&fit=crop',150.00,45,1,1,120.00,180.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(8,6,'Maquillage','maquillage','Maquillage professionnel','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop',180.00,60,1,1,144.00,216.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(9,7,'Manucure classique','manucure-classique','Manucure avec vernis','https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop',80.00,30,1,1,64.00,96.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(10,7,'Manucure gel','manucure-gel','Pose de vernis semi-permanent','https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop',120.00,45,1,1,96.00,144.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(11,7,'PÃ©dicure classique','pedicure-classique','PÃ©dicure avec vernis','https://images.unsplash.com/photo-1599206676335-193c82b13c9e?w=800&h=600&fit=crop',100.00,45,1,1,80.00,120.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(12,7,'PÃ©dicure spa','pedicure-spa','PÃ©dicure avec soin relaxant','https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&h=600&fit=crop',150.00,60,1,1,120.00,180.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(13,8,'Massage relaxant 30min','massage-relaxant-30','Massage relaxant de 30 minutes','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=600&fit=crop',150.00,30,1,1,120.00,180.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(14,8,'Massage relaxant 60min','massage-relaxant-60','Massage relaxant d\'une heure','https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&h=600&fit=crop',250.00,60,1,1,200.00,300.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(15,8,'Massage sportif','massage-sportif','Massage pour sportifs','https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&h=600&fit=crop',300.00,60,1,1,240.00,360.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(16,9,'Nettoyage appartement','nettoyage-appartement','Nettoyage complet d\'appartement','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',200.00,120,1,1,160.00,240.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(17,9,'Nettoyage villa','nettoyage-villa','Nettoyage complet de villa','https://images.unsplash.com/photo-1600320254374-ce2d293c324e?w=800&h=600&fit=crop',400.00,240,1,1,320.00,480.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(18,9,'Nettoyage express','nettoyage-express','Nettoyage rapide','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop',120.00,60,1,1,96.00,144.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(19,10,'DÃ©pannage plomberie','depannage-plomberie','Intervention d\'urgence','https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop',250.00,60,1,1,200.00,300.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(20,10,'Installation sanitaire','installation-sanitaire','Installation Ã©quipement sanitaire','https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop',300.00,120,1,1,240.00,360.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(21,11,'DÃ©pannage Ã©lectrique','depannage-electrique','Intervention d\'urgence','https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop',250.00,60,1,1,200.00,300.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(22,11,'Installation Ã©lectrique','installation-electrique','Installation Ã©quipement Ã©lectrique','https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600&fit=crop',300.00,120,1,1,240.00,360.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(23,12,'Tonte de pelouse','tonte-pelouse','Tonte et entretien de pelouse','https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&h=600&fit=crop',150.00,60,1,1,120.00,180.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(24,12,'Taille de haies','taille-haies','Taille et formation de haies','https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop',180.00,90,1,1,144.00,216.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(25,13,'Lavage extÃ©rieur','lavage-exterieur','Lavage extÃ©rieur complet','https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop',80.00,30,1,1,64.00,96.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(26,13,'Lavage complet','lavage-complet','Lavage intÃ©rieur et extÃ©rieur','https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop',150.00,60,1,1,120.00,180.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(27,13,'Lavage premium','lavage-premium','Lavage premium avec cirage','https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=600&fit=crop',250.00,90,1,1,200.00,300.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(28,14,'Vidange','vidange','Vidange et changement de filtre','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',300.00,45,1,1,240.00,360.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(29,14,'Diagnostic panne','diagnostic-panne','Diagnostic mÃ©canique','https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&h=600&fit=crop',200.00,60,1,1,160.00,240.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(30,15,'Toilettage chien petit','toilettage-chien-petit','Pour chiens de petite taille','https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&h=600&fit=crop',120.00,45,1,1,96.00,144.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(31,15,'Toilettage chien grand','toilettage-chien-grand','Pour chiens de grande taille','https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',200.00,90,1,1,160.00,240.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(32,15,'Toilettage chat','toilettage-chat','Toilettage pour chat','https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop',100.00,45,1,1,80.00,120.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(33,16,'Consultation vÃ©tÃ©rinaire','consultation-veterinaire','Consultation Ã  domicile','https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop',250.00,30,1,1,200.00,300.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(34,16,'Vaccination','vaccination','Vaccination Ã  domicile','https://images.unsplash.com/photo-1530041539828-114de669390e?w=800&h=600&fit=crop',200.00,20,1,1,160.00,240.00,'2025-11-14 14:38:30','2025-11-19 08:01:45'),(35,19,'Ménage classique','menage-classique','Nettoyage standard de votre logement','https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&h=600&fit=crop',100.00,60,1,1,80.00,120.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(36,19,'Ménage approfondi','menage-approfondi','Nettoyage en profondeur avec détails','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop',175.00,90,1,1,140.00,210.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(37,19,'Nettoyage après événement','nettoyage-apres-evenement','Remise en état après fête ou réception','https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=600&fit=crop',650.00,210,1,1,520.00,780.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(38,19,'Nettoyage de printemps','nettoyage-printemps','Grand nettoyage annuel complet','https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=600&fit=crop',1000.00,480,1,1,800.00,1200.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(39,19,'Nettoyage cuisine','nettoyage-cuisine','Nettoyage complet de la cuisine','https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop',400.00,120,1,1,320.00,480.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(40,19,'Nettoyage salle de bain','nettoyage-salle-bain','Nettoyage et désinfection sanitaires','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop',275.00,90,1,1,220.00,330.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(41,19,'Service repassage','service-repassage','Repassage professionnel à domicile','https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=600&fit=crop',200.00,60,1,1,160.00,240.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(42,20,'Montage meuble','montage-meuble','Assemblage de meubles en kit','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',200.00,60,1,1,160.00,240.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(43,20,'Changement d\'ampoule','changement-ampoule','Remplacement d\'ampoules difficiles d\'accès','https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',65.00,15,1,1,52.00,78.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(44,20,'Petits travaux plomberie','petits-travaux-plomberie','Réparations simples de plomberie','https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop',300.00,60,1,1,240.00,360.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(45,20,'Perçage et fixation','percage-fixation','Installation d\'étagères, cadres, etc.','https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&h=600&fit=crop',115.00,30,1,1,92.00,138.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(46,20,'Petit déménagement','petit-demenagement','Déplacement d\'objets lourds ou encombrants','https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&h=600&fit=crop',600.00,120,1,1,480.00,720.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(47,12,'Entretien pelouse','entretien-pelouse','Tonte et entretien de gazon','https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&h=600&fit=crop',250.00,60,1,1,200.00,300.00,'2025-11-18 08:11:15','2025-11-19 08:01:45'),(48,12,'Plantation fleurs','plantation-fleurs','Plantation et aménagement floral','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',200.00,60,1,1,160.00,240.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(49,21,'Préparation repas','preparation-repas','Chef prépare vos repas à domicile','https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop',500.00,120,1,1,400.00,600.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(50,21,'Chef événementiel','chef-evenementiel','Service traiteur pour événements','https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&h=600&fit=crop',1500.00,240,1,1,1200.00,1800.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(51,21,'Coaching cuisine','coaching-cuisine','Cours de cuisine personnalisé','https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&h=600&fit=crop',400.00,90,1,1,320.00,480.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(52,22,'Coupe classique homme','coupe-classique-homme','Coupe de cheveux classique','https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop',135.00,30,1,1,108.00,162.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(53,22,'Coupe tendance homme','coupe-tendance-homme','Coupe moderne et stylée','https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=800&h=600&fit=crop',175.00,40,1,1,140.00,210.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(54,22,'Taille de barbe classique','taille-barbe-classique','Entretien de barbe simple','https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=600&fit=crop',100.00,20,1,1,80.00,120.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(55,22,'Barbe et contours','barbe-contours','Taille précise avec contours nets','https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&h=600&fit=crop',125.00,30,1,1,100.00,150.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(56,22,'Rasage à l\'ancienne','rasage-ancienne','Rasage traditionnel au rasoir','https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=600&fit=crop',175.00,30,1,1,140.00,210.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(57,22,'Soin barbe','soin-barbe','Soin complet pour barbe','https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&h=600&fit=crop',150.00,30,1,1,120.00,180.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(58,22,'Combo coupe + barbe','combo-coupe-barbe','Coupe cheveux et entretien barbe','https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&h=600&fit=crop',260.00,60,1,1,208.00,312.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(59,23,'Coupe cheveux courts','coupe-cheveux-courts','Coupe pour cheveux courts','https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop',225.00,45,1,1,180.00,270.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(60,23,'Coupe cheveux longs','coupe-cheveux-longs','Coupe pour cheveux longs','https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop',300.00,60,1,1,240.00,360.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(61,23,'Coloration cheveux courts','coloration-cheveux-courts','Coloration complète cheveux courts','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',450.00,75,1,1,360.00,540.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(62,23,'Coloration cheveux longs','coloration-cheveux-longs','Coloration complète cheveux longs','https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800&h=600&fit=crop',700.00,105,1,1,560.00,840.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(63,24,'Maquillage jour','maquillage-jour','Maquillage naturel et léger','https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop',300.00,45,1,1,240.00,360.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(64,24,'Maquillage soirée','maquillage-soiree','Maquillage sophistiqué pour soirée','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop',500.00,60,1,1,400.00,600.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(65,24,'Maquillage mariage','maquillage-mariage','Maquillage mariée avec essai','https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=600&fit=crop',1000.00,120,1,1,800.00,1200.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(66,7,'Manucure femme','manucure-femme','Soin des mains et ongles','https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&h=600&fit=crop',175.00,45,1,1,140.00,210.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(67,7,'Manucure homme','manucure-homme','Soin des ongles masculin','https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&h=600&fit=crop',135.00,30,1,1,108.00,162.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(68,25,'Jambes complètes femme','jambes-completes-femme','Épilation jambes entières','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop',225.00,45,1,1,180.00,270.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(69,25,'Sourcils et visage','sourcils-visage','Épilation zone visage','https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&h=600&fit=crop',125.00,20,1,1,100.00,150.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(70,26,'Torse ou dos','torse-dos-homme','Épilation torse ou dos','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',300.00,45,1,1,240.00,360.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(71,26,'Bras complets','bras-complets-homme','Épilation des deux bras','https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=800&h=600&fit=crop',250.00,40,1,1,200.00,300.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(72,27,'Vidange huile','vidange-huile','Vidange complète avec filtre','https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=600&fit=crop',500.00,60,1,1,400.00,600.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(73,27,'Changement ampoule voiture','changement-ampoule-voiture','Remplacement d\'ampoule auto','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',100.00,20,1,1,80.00,120.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(74,27,'Changement essuie-glace','changement-essuie-glace','Remplacement balais essuie-glace','https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop',125.00,20,1,1,100.00,150.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(75,27,'Changement pneu','changement-pneu','Démontage et montage de pneu','https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=600&fit=crop',325.00,45,1,1,260.00,390.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(76,28,'Nettoyage extérieur seul','nettoyage-exterieur-seul','Lavage extérieur complet','https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop',150.00,45,1,1,120.00,180.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(77,28,'Nettoyage intérieur seul','nettoyage-interieur-seul','Nettoyage intérieur approfondi','https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&h=600&fit=crop',185.00,60,1,1,148.00,222.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(78,28,'Combo intérieur + extérieur','combo-interieur-exterieur','Nettoyage complet du véhicule','https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&h=600&fit=crop',325.00,90,1,1,260.00,390.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(79,8,'Massage tonique','massage-tonique','Massage énergisant et stimulant','https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&h=600&fit=crop',400.00,60,1,1,320.00,480.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(80,8,'Massage thaïlandais','massage-thailandais','Massage traditionnel thaï','https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&h=600&fit=crop',600.00,75,1,1,480.00,720.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(81,8,'Massage marocain traditionnel','massage-marocain','Massage aux huiles orientales','https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',700.00,90,1,1,560.00,840.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(82,29,'Yoga','yoga','Séance de yoga à domicile','https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',250.00,60,1,1,200.00,300.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(83,29,'Pilates','pilates','Séance de pilates personnalisée','https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop',300.00,60,1,1,240.00,360.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(84,29,'Étirements guidés','etirements-guides','Séance d\'étirements et souplesse','https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=600&fit=crop',250.00,45,1,1,200.00,300.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(85,29,'Musculation personnalisée','musculation-personnalisee','Entraînement musculation sur mesure','https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop',400.00,60,1,1,320.00,480.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(86,29,'Méditation et respiration','meditation-respiration','Séance de méditation guidée','https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',250.00,45,1,1,200.00,300.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(87,29,'Coaching nutrition','coaching-nutrition','Consultation nutritionnelle','https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',400.00,60,1,1,320.00,480.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(88,30,'Toilettage chien','toilettage-chien','Toilettage complet pour chien','https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800&h=600&fit=crop',325.00,60,1,1,260.00,390.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(89,30,'Promenade chien','promenade-chien','Balade quotidienne pour votre chien','https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=600&fit=crop',115.00,30,1,1,92.00,138.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(90,30,'Gardiennage à domicile','gardiennage-domicile','Garde d\'animaux par jour','https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',200.00,1440,1,1,160.00,240.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(91,30,'Gardiennage longue durée','gardiennage-longue-duree','Garde d\'animaux par semaine','https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop',1250.00,10080,1,1,1000.00,1500.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(92,30,'Nourrissage animaux','nourrissage-animaux','Visite pour nourrir vos animaux','https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&h=600&fit=crop',65.00,15,1,1,52.00,78.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(93,30,'Transport animaux','transport-animaux','Transport sécurisé pour animaux','https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&h=600&fit=crop',200.00,60,1,1,160.00,240.00,'2025-11-18 08:11:16','2025-11-19 08:01:45'),(94,30,'Nettoyage espace animal','nettoyage-espace-animal','Nettoyage de niche, litière, etc.','https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600&fit=crop',150.00,30,1,1,120.00,180.00,'2025-11-18 08:11:16','2025-11-19 08:01:45');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `label` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Maison, Travail, etc.',
  `address_line` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Marrakech',
  `postal_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (1,4,'Réservation','47 avenue leclerc','Marrakech',NULL,NULL,NULL,0,'2025-11-16 18:45:27','2025-11-16 18:45:27'),(2,4,'Réservation','4 rue du coin','Marrakech',NULL,NULL,NULL,0,'2025-11-16 19:51:27','2025-11-16 19:51:27'),(3,2,'Réservation','rue du 4 aout','Marrakech',NULL,NULL,NULL,0,'2025-11-16 20:01:08','2025-11-16 20:01:08'),(4,8,'Réservation','250 rue du 4 aout','Marrakech',NULL,NULL,NULL,0,'2025-11-16 20:09:29','2025-11-16 20:09:29'),(5,8,'Réservation','4 rue de jean','Marrakech',NULL,NULL,NULL,0,'2025-11-16 21:01:34','2025-11-16 21:01:34'),(6,8,'Réservation','2 rue dubois','Marrakech',NULL,NULL,NULL,0,'2025-11-16 21:32:23','2025-11-16 21:32:23'),(7,11,'Réservation','2 rue du platre','Marrakech',NULL,NULL,NULL,0,'2025-11-18 08:02:11','2025-11-18 08:02:11'),(8,11,'Réservation','2 rue du platre','Marrakech',NULL,NULL,NULL,0,'2025-11-18 11:17:33','2025-11-18 11:17:33'),(9,11,'Réservation','3 rue du platre','Marrakech',NULL,NULL,NULL,0,'2025-11-18 11:21:28','2025-11-18 11:21:28'),(10,11,'maison','61 Avenue Général Leclerc','Marrakech','69100',NULL,NULL,1,'2025-11-18 12:22:20','2025-11-18 12:22:20'),(11,11,'Réservation','54 rue Laye','Marrakech',NULL,NULL,NULL,0,'2025-11-18 12:35:34','2025-11-18 12:35:34'),(12,12,'Réservation','2 rue du platre','Marrakech',NULL,NULL,NULL,0,'2025-11-18 13:49:57','2025-11-18 13:49:57'),(13,12,'Réservation','32 rue de sa','Marrakech',NULL,NULL,NULL,0,'2025-11-18 15:02:07','2025-11-18 15:02:07');
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `referred_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `referral_code` (`referral_code`),
  KEY `referred_by` (`referred_by`),
  KEY `idx_email` (`email`),
  KEY `idx_referral_code` (`referral_code`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`referred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'test@example.com','$2y$10$SorOGm0P4ALfSC5aVUZ0vu.KiqEnmbhJcMsMXDBYBj6vyN2uyUK7.','Test','User',NULL,NULL,'TEST1234',NULL,'2025-11-16 11:04:11','2025-11-16 11:04:11'),(2,'m.bi321@hotmail.fr','y2.NLaXHjF6Zi1ZNxleS.eWYXM6iuQhkvtHGNA6FmSodUt964.','Jean-Marc','Forest','0612345678',NULL,'E5RKDLVK',NULL,'2025-11-16 11:08:21','2025-11-17 15:07:51'),(3,'fatima@provider.com','$2y$12$7nFFtuKCzGCkcFzNBCKoLuAaF5ctJBGMnqXgQIAVZe6zHvmPxIMOy','Baptiste','DURAND','0612345678',NULL,'872DABJ4',NULL,'2025-11-16 11:14:01','2025-11-16 11:14:01'),(4,'m.bi@hotmail.fr','$2y$12$c93sNumUrgynsCYxCc7Od.lSu48yMJ9wMYJqZsoE7C7vql1RoVJS2','laye','ysec','0612345678',NULL,'F7DN2F65',NULL,'2025-11-16 13:44:58','2025-11-16 13:44:58'),(5,'m.bi23@hotmail.fr','$2y$12$yanVU3aE0NEyLdYGye/Ch.55JHyLbHvIJXK4AJruRuZ1CHMwft0K.','Marie','sarr','0612345678',NULL,'8TNVTQGE',NULL,'2025-11-16 14:00:57','2025-11-16 14:00:57'),(6,'m.bi234@hotmail.fr','$2y$12$ibCdgWFRIARd9b8N5aJBU.UG0gy9TnXbbb..6.60S4mDGActtiqOW','Marie','sarr','0612345678',NULL,'VABAB4AQ',NULL,'2025-11-16 14:04:20','2025-11-16 14:04:20'),(7,'m.biz@hotmail.fr','$2y$12$9aC2hvATuiMdLdnuEKkrJOi3jqLtm42XKxNtN6uvzqkqPS3s/w/aW','laye','sarr','0612345678',NULL,'AQG8N8L2',NULL,'2025-11-16 14:27:49','2025-11-16 14:27:49'),(8,'m.bi2012@hotmail.fr','$2y$12$bJ186.sKaM9n4N3YeyaioOPV.jBceY91XrjJEtMvZFRnL78exNZT.','Elhadj','yelab','0612345678',NULL,'Q4MMDJBY',NULL,'2025-11-16 20:07:54','2025-11-16 20:07:54'),(9,'m.b2016i@hotmail.fr','$2y$12$WKBgt2NBd7AB0JvRZilpLuNFpmtxCYty30KHYXoFLdVSYGYUWZozy','Adja','seck','0612345678',NULL,'9FLXK6MR',NULL,'2025-11-17 14:58:10','2025-11-17 14:58:10'),(10,'m.bi74@hotmail.fr','$2y$12$9b.6TcLLRX9ff46PCiKNY.MXsVERwKCDM8nHiR.0DYqseJpaAuvtC','laye','seck','0612345678',NULL,'VBTJJKG4',NULL,'2025-11-17 15:08:02','2025-11-17 15:08:02'),(11,'m.bi123@hotmail.fr','$2y$12$rUJOAzMIo8uImA36P2UobuQm87u6lWpWO/UNvECo8wEh0U6TNwilS','Laye','Boy','0612345678',NULL,'P227XRJ7',NULL,'2025-11-18 07:53:30','2025-11-18 07:53:30'),(12,'m.bi2016@hotmail.fr','$2y$12$tNo/Hj0LHdsXlHoSY5o8zeCOKrCja/HJCtEkP9TWiu9agtNcPh4r6','Khadim','seck','0612345678',NULL,'MNT5T9B8',NULL,'2025-11-18 13:48:34','2025-11-18 13:48:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_bidding_orders_summary`
--

DROP TABLE IF EXISTS `v_bidding_orders_summary`;
/*!50001 DROP VIEW IF EXISTS `v_bidding_orders_summary`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_bidding_orders_summary` AS SELECT 
 1 AS `order_id`,
 1 AS `user_id`,
 1 AS `service_id`,
 1 AS `service_name`,
 1 AS `user_proposed_price`,
 1 AS `status`,
 1 AS `bid_expiry_time`,
 1 AS `total_bids`,
 1 AS `lowest_bid`,
 1 AS `highest_bid`,
 1 AS `avg_bid`,
 1 AS `created_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_bidding_orders_summary`
--

/*!50001 DROP VIEW IF EXISTS `v_bidding_orders_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`glamgo_user`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_bidding_orders_summary` AS select `o`.`id` AS `order_id`,`o`.`user_id` AS `user_id`,`o`.`service_id` AS `service_id`,`s`.`name` AS `service_name`,`o`.`user_proposed_price` AS `user_proposed_price`,`o`.`status` AS `status`,`o`.`bid_expiry_time` AS `bid_expiry_time`,count(`b`.`id`) AS `total_bids`,min(`b`.`proposed_price`) AS `lowest_bid`,max(`b`.`proposed_price`) AS `highest_bid`,avg(`b`.`proposed_price`) AS `avg_bid`,`o`.`created_at` AS `created_at` from ((`orders` `o` join `services` `s` on((`o`.`service_id` = `s`.`id`))) left join `bids` `b` on(((`o`.`id` = `b`.`order_id`) and (`b`.`status` = 'pending')))) where (`o`.`pricing_mode` = 'bidding') group by `o`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-19  9:13:17
