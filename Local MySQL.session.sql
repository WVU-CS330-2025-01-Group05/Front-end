CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

UPDATE users
SET bio = "No Bio"
WHERE bio IS NULL;

UPDATE users
SET numOfHikes = 0
WHERE numOfHikes IS NULL;

UPDATE users
SET nameVar = "John Doe"
WHERE nameVar IS NULL;