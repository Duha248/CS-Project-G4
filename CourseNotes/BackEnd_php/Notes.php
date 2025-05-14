<?php
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

// Setting headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

try {
    // Connecting to the database
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Handling preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0); 
    }

    // Handling GET requests only
   if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // Pagination parameters from URL
    $page = isset($_GET['_page']) ? (int) $_GET['_page'] : 1;
    $limit = isset($_GET['_limit']) ? (int) $_GET['_limit'] : 10;
    $offset = ($page - 1) * $limit;

    // Get total number of course notes for pagination
    $totalStmt = $pdo->query("SELECT COUNT(*) FROM course_notes");
    $totalCount = $totalStmt->fetchColumn();
    header("X-Total-Count: $totalCount");

    // Get paginated course notes
    $stmt = $pdo->prepare("SELECT id, title, author, summary, date FROM course_notes ORDER BY id DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $course_notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($course_notes);
}


    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        // Validating the fields
        if (!isset($data['title'], $data['author'], $data['summary'], $data['date'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit;
        }

        // Inserting the data into the database
        $stmt = $pdo->prepare("INSERT INTO course_notes (title, author, summary, date) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['title'],
            $data['author'],
            $data['summary'],
            $data['date']
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Course note added successfully.",
            "data" => [
                "id" => $pdo->lastInsertId(),
                "title" => $data['title'],
                "author" => $data['author'],
                "summary" => $data['summary'],
                "date" => $data['date']
            ]
        ]);
    }

    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        parse_str($_SERVER['QUERY_STRING'], $queryParams);
        $id = $queryParams['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Missing course note ID."]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM course_notes WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["error" => "Course note not found or already deleted."]);
        } else {
            echo json_encode(["success" => true, "message" => "Course note deleted successfully."]);
        }
    }

    elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $newSummary = $data['summary'] ?? null;

        if (!$id || !$newSummary) {
            http_response_code(400);
            echo json_encode(["error" => "Missing id or summary."]);
            exit;
        }

        // Fetching the course note by ID
        $stmt = $pdo->prepare("SELECT * FROM course_notes WHERE id = ?");
        $stmt->execute([$id]);
        $course_note = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$course_note) {
            http_response_code(404);
            echo json_encode(["error" => "Course note not found."]);
            exit;
        }

        // Updating the summary of the course note
        $stmt = $pdo->prepare("UPDATE course_notes SET summary = ? WHERE id = ?");
        $stmt->execute([$newSummary, $id]);

        echo json_encode(["success" => true, "message" => "Course note summary updated."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>
