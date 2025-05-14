<?php
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

// Set HTTP headers for CORS and JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Create DB connection
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Accept only POST requests
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        // Validate required fields
        if (!isset($input['Club'], $input['Activity'], $input['Date'], $input['Location'], $input['Description'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit;
        }

        // Default empty comments array (can be updated later if required)
        $comments = isset($input['comments']) ? json_encode($input['comments']) : json_encode([]);

        // Insert into database
        $stmt = $pdo->prepare("
            INSERT INTO club_activities (Club, Activity, Date, Location, Description, comments) 
            VALUES (:club, :activity, :date, :location, :description, :comments)
        ");

        $stmt->execute([
            ':club' => $input['Club'],
            ':activity' => $input['Activity'],
            ':date' => $input['Date'],
            ':location' => $input['Location'],
            ':description' => $input['Description'],
            ':comments' => $comments
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Activity added successfully.",
            "activity_id" => $pdo->lastInsertId()
        ]);
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>