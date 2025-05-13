<?php
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

// Setting headers:
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

try {
    // Connecting to the database:
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Handling preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0); 
    }

    // Handling GET requests only
    // Fetching data from the database and decoding JSON comments
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("SELECT id, Title, College, Date, Author, News, comments FROM campusnews ORDER BY id DESC");
        $campusnews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($campusnews as &$newsItem) {
            if (!empty($newsItem['comments'])) {
                $decoded = json_decode($newsItem['comments'], true);
                $newsItem['comments'] = $decoded ?: []; 
            } else {
                $newsItem['comments'] = [];
            }
        }
        echo json_encode($campusnews);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        // Validating the fields
        if (!isset($data['Title'], $data['College'], $data['Date'], $data['Author'], $data['News'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit;
        }

        $comments = isset($data['comments']) && is_array($data['comments']) 
            ? json_encode($data['comments']) 
            : json_encode([]);

        // Inserting the data into the database using insert query
        $stmt = $pdo->prepare("INSERT INTO campusnews (Title, College, Date, Author, News, comments) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['Title'],
            $data['College'],
            $data['Date'],
            $data['Author'],
            $data['News'],
            $comments
        ]);
        echo json_encode([
            "success" => true,
            "message" => "News article added successfully.",
            "data" => [
                "id" => $pdo->lastInsertId(),
                "Title" => $data['Title'],
                "College" => $data['College'],
                "Date" => $data['Date'],
                "Author" => $data['Author'],
                "News" => $data['News'],
                "comments" => json_decode($comments, true)
            ]
        ]);
    }  
    
    // Handling delete request
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            parse_str($_SERVER['QUERY_STRING'], $queryParams);
            $id = $queryParams['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "Missing news ID."]);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM campusnews WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(["error" => "News not found or already deleted."]);
            } else {
                echo json_encode(["success" => true, "message" => "News deleted successfully."]);
            }
        } 
        
        // Handling comment and content validation
        elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $newComment = $data['comment'] ?? null;
        if (!$id || !$newComment) {
            http_response_code(400);
            echo json_encode(["error" => "Missing id or comment."]);
            exit;
        }

        // Fetching the comments from the database
        $stmt = $pdo->prepare("SELECT comments FROM campusnews WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(["error" => "New not found."]);
            exit;
        }

        $comments = json_decode($row['comments'] ?? '[]', true);
        $comments[] = $newComment;

        // Adding the new comment
        $stmt = $pdo->prepare("UPDATE campusnews SET comments = ? WHERE id = ?");
        $stmt->execute([json_encode($comments), $id]);

        echo json_encode(["success" => true, "message" => "Comment added."]);
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>