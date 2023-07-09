USE employee_tracker;

-- Get all employees by role
SELECT
    s.first_name,
    s.last_name,
    c.title AS role_title,
    d.name AS department
FROM employee e
JOIN roles r ON e.roles_id = r.id
JOIN department d ON r.department_id = d.id
WHERE r.id = 1;

-- Get all employees
SELECT * FROM employee;
