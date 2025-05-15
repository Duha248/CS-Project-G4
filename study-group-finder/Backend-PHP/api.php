<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}
// Database connection
$host = "127.0.0.1";
$user = getenv("db_user");
$pass = getenv("db_pass");
$db = getenv("db_name");

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Parse JSON body if POST
$input = ($_SERVER['REQUEST_METHOD'] === 'POST') ? json_decode(file_get_contents("php://input"), true) : [];

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'get_groups':
        $filters = [
            'courseCode' => $_GET['courseCode'] ?? null,
            'college' => $_GET['college'] ?? null,
            'sortBy' => $_GET['sortBy'] ?? 'date_new'
        ];

        // Base query with comment count
        $query = "SELECT g.*, COUNT(c.id) as comment_count 
                  FROM groups g 
                  LEFT JOIN comments c ON g.id = c.group_id";

        $where = [];
        $params = [];

        // Apply filters
        if (!empty($filters['courseCode'])) {
            $where[] = "g.course_code LIKE :courseCode";
            $params[':courseCode'] = '%' . $filters['courseCode'] . '%';
        }

        if (!empty($filters['college']) && $filters['college'] !== 'Select College') {
            $where[] = "g.college = :college";
            $params[':college'] = $filters['college'];
        }

        if (!empty($where)) {
            $query .= " WHERE " . implode(" AND ", $where);
        }

        // Group by
        $query .= " GROUP BY g.id";

        // Add sorting
        $sortOptions = [
            'code_asc' => 'g.course_code ASC',
            'code_desc' => 'g.course_code DESC', 
            'date_new' => 'g.created DESC',
            'date_old' => 'g.created ASC'
        ];
        $sort = $sortOptions[$filters['sortBy']] ?? 'g.created DESC';
        $query .= " ORDER BY " . $sort;

        // Execute query
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get comments for each group
        foreach ($groups as &$group) {
            $stmt = $pdo->prepare("
                SELECT c.*, m.name 
                FROM comments c 
                LEFT JOIN members m ON c.member_id = m.id 
                WHERE c.group_id = ? 
                ORDER BY c.time ASC
            ");
            $stmt->execute([$group['id']]);
            $group['comments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($groups);
        break;


        case 'create_group':
        error_log("Create group endpoint hit with data: " . print_r($input, true));

        try {
            $stmt = $pdo->prepare("INSERT INTO groups (course_code, course_name, description, college, created) VALUES (?, ?, ?, ?, NOW())");
            $stmt->execute([
                $input['course_code'],
                $input['course_name'],
                $input['description'] ?? '',
                $input['college']
            ]);

            error_log("Insert successful, last insert ID: " . $pdo->lastInsertId());
            echo json_encode(["success" => true]);

        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error"]);
        }
        break;


        case 'update_group':
            if (empty($input['id']) || empty($input['course_code']) || empty($input['course_name']) || empty($input['college'])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Missing required fields"]);
                break;
            }
            
            $stmt = $pdo->prepare("
                UPDATE groups 
                SET course_code = :course_code,
                    course_name = :course_name,
                    description = :description,
                    college = :college
                WHERE id = :id
            ");
            
            $stmt->execute([
                ':id' => $input['id'],
                ':course_code' => $input['course_code'],
                ':course_name' => $input['course_name'],
                ':description' => $input['description'] ?? '',
                ':college' => $input['college']
            ]);
            
            echo json_encode(["success" => true]);
            break;

    
        case 'delete_group':
        error_log("Delete request received: " . file_get_contents("php://input"));

        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing ID parameter"]);
            exit;
        }

        try {
            // Verify group exists first
            $stmt = $pdo->prepare("SELECT id FROM groups WHERE id = ?");
            $stmt->execute([$input['id']]);

            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Group not found"]);
                exit;
            }

            // Proceed with deletion
            $stmt = $pdo->prepare("DELETE FROM groups WHERE id = ?");
            $stmt->execute([$input['id']]);

            echo json_encode(["success" => true, "deleted_id" => $input['id']]);

        } catch (PDOException $e) {
            error_log("Deletion error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error"]);
        }
        break;
        
        case 'add_comment':
            if (empty($input['group_id']) || empty($input['member_id']) || empty($input['content'])) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Missing required fields"]);
                break;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO comments (group_id, member_id, content, time)
                VALUES (:group_id, :member_id, :content, NOW())
            ");
            
            $stmt->execute([
                ':group_id' => $input['group_id'],
                ':member_id' => $input['member_id'],
                ':content' => $input['content']
            ]);
            
            echo json_encode(["success" => true]);
            break;



        default:
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid action"]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>