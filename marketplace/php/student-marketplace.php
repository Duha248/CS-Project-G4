<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, PUT");

$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed."]);
    exit;
}

// Handle POST (add item to marketplace)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_GET['type']) && $_GET['type'] === 'item') {
    $data = json_decode(file_get_contents("php://input"), true);
    $title = $data["title"] ?? '';
    $description = $data["description"] ?? '';
    $price = $data["price"] ?? '';
    $condition = $data["condition"] ?? ''; // Ensure condition is correctly received
    $contact = $data["contact"] ?? '';
    $comments = json_encode([]);

    if (!$title || !$description || !$price || !$condition || !$contact) {
        http_response_code(400);
        echo json_encode(["error" => "Missing fields."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO marketplace_items (title, description, price, condition, contact, comments) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssisss", $title, $description, $price, $condition, $contact, $comments);
    $stmt->execute();
    echo json_encode(["message" => "Item added successfully."]);
    exit;
}

// Handle GET (fetch items with pagination)
$page = isset($_GET['_page']) ? intval($_GET['_page']) : 1;
$limit = isset($_GET['_limit']) ? intval($_GET['_limit']) : 7;
$offset = ($page - 1) * $limit;

$result = $conn->query("SELECT COUNT(*) as count FROM marketplace_items");
$totalCount = $result->fetch_assoc()["count"];
header("X-Total-Count: $totalCount");

$stmt = $conn->prepare("SELECT * FROM marketplace_items ORDER BY id DESC LIMIT ? OFFSET ?");
$stmt->bind_param("ii", $limit, $offset);
$stmt->execute();
$res = $stmt->get_result();
$items = [];

while ($row = $res->fetch_assoc()) {
    $items[] = $row;
}

echo json_encode($items);
$conn->close();
?>
