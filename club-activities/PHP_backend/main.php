<?php
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

// Set HTTP headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS, PATCH, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

try {
    //PDO for database connection:
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }

    // Get all activities:
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query("SELECT * FROM club_activities ORDER BY id DESC");
        $club_activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($club_activities);

    }elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Read incoming JSON and decode it:
        $data = json_decode(file_get_contents("php://input"), true);

        // Validate all form fields:
        if (!isset($data['Club'], $data['Activity'], $data['Date'], $data['Location'], $data['Description'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields."]);
            exit;
        }

        // Default empty comment:
        $comments = isset($data['comments']) ? json_encode($data['comments']) : json_encode([]);

        // Insert a new club activity:
        $stmt = $pdo->prepare("INSERT INTO club_activities (Club, Activity, Date, Location, Description, comments) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['Club'],
            $data['Activity'],
            $data['Date'],
            $data['Location'],
            $data['Description'],
            $comments
        ]);

        // Return response:
        echo json_encode([
            "success" => true,
            "message" => "Club activity added successfully.",
            "data" => [
                "id" => $pdo->lastInsertId(),
                "Club" => $data['Club'],
                "Activity" => $data['Activity'],
                "Date" => $data['Date'],
                "Location" => $data['Location'],
                "Description" => $data['Description'],
                "comments" => json_decode($comments)
            ]
        ]);
    } 
        // Delete an activity:
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        parse_str($_SERVER['QUERY_STRING'], $queryParams);
        $id = $queryParams['id'] ?? null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(["error" => "Missing activity ID."]);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM club_activities WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["error" => "Activity not found or already deleted."]);
        } else {
            echo json_encode(["success" => true, "message" => "Activity deleted successfully."]);
        }
    } 
        // Update an activity (for the comment section):
    elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        $newCommentText = $data['comment'] ?? null;

        // Validate input:
        if (!$id || !$newCommentText) {
            http_response_code(400);
            echo json_encode(["error" => "Missing activity ID or comment."]);
            exit;
        }

        // Fetch any comment there is:
        $stmt = $pdo->prepare("SELECT comments FROM club_activities WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if the activity exists:
        if (!$row) {
            http_response_code(404);
            echo json_encode(["error" => "Activity not found."]);
            exit;
        }

        // Existing comment decoding:
        $comments = json_decode($row['comments'] ?? '[]', true);
        if (!is_array($comments)) $comments = [];

        // Add comment with id:
        $comments[] = [
            "id" => uniqid("cmt_"),
            "data" => $newCommentText
        ];

        // Update Database:
        $stmt = $pdo->prepare("UPDATE club_activities SET comments = ? WHERE id = ?");
        $stmt->execute([json_encode($comments), $id]);

        // Return response:
        echo json_encode(["success" => true, "message" => "Comment added."]);
    } 
        // Update an activity (for the edit section):
    elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Read incoming JSON and decode it:
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;

        // Validate all form fields:
        if (!$id || !isset($data['Club'], $data['Activity'], $data['Date'], $data['Location'], $data['Description'])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields or activity ID."]);
            exit;
        }

        // Update the activity:
        $stmt = $pdo->prepare("UPDATE club_activities SET Club = ?, Activity = ?, Date = ?, Location = ?, Description = ? WHERE id = ?");
        $stmt->execute([
            $data['Club'],
            $data['Activity'],
            $data['Date'],
            $data['Location'],
            $data['Description'],
            $id
        ]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "message" => "Activity updated successfully."]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Activity not found or no changes made."]);
        }
    }
    else {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>