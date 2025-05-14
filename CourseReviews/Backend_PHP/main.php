<?php
// database connection attributes or data
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

// Set HTTP headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS, PATCH");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
// get all reviews to be displayed
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("SELECT * FROM reviews ORDER BY id DESC");
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($reviews as &$review) {
            if (isset($review['comments']) && $review['comments'] !== null) {
                $review['comments'] = json_decode($review['comments'], true);
            } else {
                $review['comments'] = [];
            }
        }

        echo json_encode($reviews);
// posting a new review
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['course'], $data['year'], $data['author'], $data['review'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO reviews (course, year, author, review, comments) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['course'],
            $data['year'],
            $data['author'],
            $data['review'],
            json_encode($data['comments'])
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Review added successfully.",
            "data" => [
                "id" => $pdo->lastInsertId(),
                "course" => $data['course'],
                "year" => $data['year'],
                "author" => $data['author'],
                "review" => $data['review'],
                "comments" => $data['comments']
            ]
        ]);
// delete a review
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        parse_str($_SERVER['QUERY_STRING'], $queryParams);
        $id = $queryParams['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Missing review ID."]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["error" => "Review not found or already deleted."]);
        } else {
            echo json_encode(["success" => true, "message" => "Review deleted successfully."]);
        }
// add a comment to specific review
    }  elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $newComment = $data['comment'] ?? null;
    
        if (!$id || !$newComment) {
            http_response_code(400);
            echo json_encode(["error" => "Missing id or comment."]);
            exit;
        }
    
        // fetch current comments (to display them)
        $stmt = $pdo->prepare("SELECT comments FROM reviews WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
        if (!$row) {
            http_response_code(404);
            echo json_encode(["error" => "Review not found."]);
            exit;
        }
    
        $comments = json_decode($row['comments'] ?? '[]', true);
        $comments[] = $newComment;
    
        // update the review with the new comments array
        $stmt = $pdo->prepare("UPDATE reviews SET comments = ? WHERE id = ?");
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
