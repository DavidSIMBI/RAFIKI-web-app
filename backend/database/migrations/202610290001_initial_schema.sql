-- RAFIKI initial relational schema. All foreign keys intentionally restrict deletion.
-- Connection sessions must use UTC (SET time_zone = '+00:00').

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role ENUM('client', 'rider', 'association_manager', 'admin') NOT NULL,
  account_status ENUM('pending', 'active', 'suspended', 'closed') NOT NULL DEFAULT 'pending',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NULL,
  phone VARCHAR(32) NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY idx_users_role_status (role, account_status),
  CONSTRAINT ck_users_login_identifier CHECK (email IS NOT NULL OR phone IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS rider_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  verification_status ENUM('unsubmitted', 'pending', 'verified', 'rejected', 'suspended') NOT NULL DEFAULT 'unsubmitted',
  availability_status ENUM('offline', 'available', 'busy') NOT NULL DEFAULT 'offline',
  display_name VARCHAR(120) NULL,
  vehicle_description VARCHAR(180) NULL,
  verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  KEY idx_rider_profiles_discovery (verification_status, availability_status),
  CONSTRAINT fk_rider_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_rider_profiles_verified_availability CHECK (
    availability_status <> 'available' OR verification_status = 'verified'
  )
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS associations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  manager_user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  locality VARCHAR(120) NOT NULL,
  territory VARCHAR(120) NULL,
  province VARCHAR(120) NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'CD',
  association_status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_associations_location_name (country_code, province, territory, locality, name),
  KEY idx_associations_manager (manager_user_id),
  CONSTRAINT fk_associations_manager FOREIGN KEY (manager_user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS association_memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  association_id BIGINT UNSIGNED NOT NULL,
  rider_user_id BIGINT UNSIGNED NOT NULL,
  membership_status ENUM('pending', 'active', 'left', 'suspended') NOT NULL DEFAULT 'pending',
  joined_at DATETIME(3) NULL,
  left_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_association_membership (association_id, rider_user_id),
  KEY idx_memberships_rider_status (rider_user_id, membership_status),
  CONSTRAINT fk_memberships_association FOREIGN KEY (association_id) REFERENCES associations (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_memberships_rider FOREIGN KEY (rider_user_id) REFERENCES rider_profiles (user_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_membership_dates CHECK (
    (membership_status = 'active' AND joined_at IS NOT NULL AND left_at IS NULL)
    OR (membership_status IN ('pending', 'suspended') AND left_at IS NULL)
    OR (membership_status = 'left' AND left_at IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS rider_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rider_user_id BIGINT UNSIGNED NOT NULL,
  document_type ENUM('identity', 'rider_permit', 'vehicle_registration', 'other') NOT NULL,
  private_storage_key VARCHAR(512) NOT NULL,
  original_filename VARCHAR(255) NULL,
  mime_type VARCHAR(120) NULL,
  file_size_bytes BIGINT UNSIGNED NULL,
  verification_status ENUM('pending', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  expires_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_rider_documents_rider_status (rider_user_id, verification_status),
  KEY idx_rider_documents_reviewer (reviewed_by_user_id),
  CONSTRAINT fk_rider_documents_rider FOREIGN KEY (rider_user_id) REFERENCES rider_profiles (user_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_rider_documents_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS trips (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_user_id BIGINT UNSIGNED NOT NULL,
  rider_user_id BIGINT UNSIGNED NULL,
  status ENUM('pending', 'accepted', 'rider_en_route', 'rider_arrived', 'in_progress', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
  pickup_description VARCHAR(500) NOT NULL,
  pickup_latitude DECIMAL(10,7) NULL,
  pickup_longitude DECIMAL(10,7) NULL,
  dropoff_description VARCHAR(500) NOT NULL,
  dropoff_latitude DECIMAL(10,7) NULL,
  dropoff_longitude DECIMAL(10,7) NULL,
  agreed_price DECIMAL(12,2) NULL,
  currency_code CHAR(3) NULL,
  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  accepted_at DATETIME(3) NULL,
  rider_en_route_at DATETIME(3) NULL,
  rider_arrived_at DATETIME(3) NULL,
  started_at DATETIME(3) NULL,
  completed_at DATETIME(3) NULL,
  cancelled_at DATETIME(3) NULL,
  expires_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_trips_client_status_created (client_user_id, status, created_at),
  KEY idx_trips_rider_status_created (rider_user_id, status, created_at),
  KEY idx_trips_status_created (status, created_at),
  CONSTRAINT fk_trips_client FOREIGN KEY (client_user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_trips_rider FOREIGN KEY (rider_user_id) REFERENCES rider_profiles (user_id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_trips_distinct_parties CHECK (rider_user_id IS NULL OR rider_user_id <> client_user_id),
  CONSTRAINT ck_trips_price CHECK (
    (agreed_price IS NULL AND currency_code IS NULL)
    OR (agreed_price IS NOT NULL AND agreed_price >= 0 AND currency_code IS NOT NULL)
  ),
  CONSTRAINT ck_trips_pickup_coordinates CHECK (
    (pickup_latitude IS NULL AND pickup_longitude IS NULL)
    OR (pickup_latitude IS NOT NULL AND pickup_longitude IS NOT NULL
      AND pickup_latitude BETWEEN -90 AND 90 AND pickup_longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT ck_trips_dropoff_coordinates CHECK (
    (dropoff_latitude IS NULL AND dropoff_longitude IS NULL)
    OR (dropoff_latitude IS NOT NULL AND dropoff_longitude IS NOT NULL
      AND dropoff_latitude BETWEEN -90 AND 90 AND dropoff_longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT ck_trips_agreed_before_acceptance CHECK (
    status NOT IN ('accepted', 'rider_en_route', 'rider_arrived', 'in_progress', 'completed')
    OR (rider_user_id IS NOT NULL AND agreed_price IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS trip_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id BIGINT UNSIGNED NOT NULL,
  previous_status ENUM('pending', 'accepted', 'rider_en_route', 'rider_arrived', 'in_progress', 'completed', 'cancelled', 'expired') NULL,
  new_status ENUM('pending', 'accepted', 'rider_en_route', 'rider_arrived', 'in_progress', 'completed', 'cancelled', 'expired') NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  change_note VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_trip_history_trip_time (trip_id, created_at),
  KEY idx_trip_history_actor (actor_user_id),
  CONSTRAINT fk_trip_history_trip FOREIGN KEY (trip_id) REFERENCES trips (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_trip_history_actor FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_trip_history_status_change CHECK (previous_status IS NULL OR previous_status <> new_status)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS association_contributions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  membership_id BIGINT UNSIGNED NOT NULL,
  contribution_period_start DATE NOT NULL,
  contribution_period_end DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  contribution_status ENUM('pending', 'paid', 'waived', 'cancelled') NOT NULL DEFAULT 'pending',
  paid_at DATETIME(3) NULL,
  received_by_user_id BIGINT UNSIGNED NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_contribution_period (membership_id, contribution_period_start, contribution_period_end),
  KEY idx_contributions_status_period (contribution_status, contribution_period_start),
  KEY idx_contributions_receiver (received_by_user_id),
  CONSTRAINT fk_contributions_membership FOREIGN KEY (membership_id) REFERENCES association_memberships (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_contributions_receiver FOREIGN KEY (received_by_user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT ck_contributions_amount CHECK (amount >= 0),
  CONSTRAINT ck_contributions_period CHECK (contribution_period_end >= contribution_period_start),
  CONSTRAINT ck_contributions_paid_fields CHECK (
    (contribution_status = 'paid' AND paid_at IS NOT NULL)
    OR (contribution_status <> 'paid' AND paid_at IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
