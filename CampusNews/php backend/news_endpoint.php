<?php
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

// Setting headers:
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handling preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Establishing DB connection
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Handling POST requests only
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        // Ensuring that the fields are not empty
        if (!isset($input['Title'], $input['College'], $input['Date'], $input['Author'], $input['News'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit;
        }

        $comments = json_encode([]);

        // Adding the new data to the database
        $stmt = $pdo->prepare("
            INSERT INTO campusnews (Title, College, Date, Author, News, comments) 
            VALUES (:title, :college, :date, :author, :news, :comments)
        ");
        $stmt->execute([
            ':title' => $input['Title'],
            ':college' => $input['College'],
            ':date' => $input['Date'],
            ':author' => $input['Author'],
            ':news' => $input['News'],
            ':comments' => $comments
        ]);
        echo json_encode([
            "success" => true,
            "message" => "News added successfully.",
            "news_id" => $pdo->lastInsertId()
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