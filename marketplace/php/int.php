<?php
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
   die("❌ Connection failed: " . $conn->connect_error);
}
$sql = "CREATE TABLE IF NOT EXISTS marketplace_items (
   id INT AUTO_INCREMENT PRIMARY KEY,
   title VARCHAR(255) NOT NULL,
   description TEXT NOT NULL,
   item_condition ENUM('new', 'used') NOT NULL,
   price DECIMAL(10,2) NOT NULL,
   contact VARCHAR(50) NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
if ($conn->query($sql) === TRUE) {
   echo "✅ Table 'marketplace_items' created successfully!";
} else {
   echo "❌ Error creating table: " . $conn->error;
}
$conn->close();
?>