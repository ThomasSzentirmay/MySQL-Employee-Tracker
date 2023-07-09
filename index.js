const inquirer = require('inquirer');
const mysql = require('mysql2');

// Create a connection to the MySQL database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'employee_tracker',
});

// Connect to the database
connection.connect(async (err) => {
    if (err) throw err;
    console.log('Connected to the employee_tracker database.');
    await startApp();
});

// Prompt the user to choose an action
async function startApp() {
    try {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    'View all departments',
                    'View all roles',
                    'View all employees',
                    'Add a department',
                    'Add a role',
                    'Add an employee',
                    'Update an employee role',
                    'Exit',
                ],
            },
        ]);

        switch (answer.action) {
            case 'View all departments':
                await viewDepartments();
                break;
            case 'View all roles':
                await viewRoles();
                break;
            case 'View all employees':
                await viewEmployees();
                break;
            case 'Add a department':
                await addDepartment();
                break;
            case 'Add a role':
                await addRole();
                break;
            case 'Add an employee':
                await addEmployee();
                break;
            case 'Update an employee role':
                await updateEmployeeRole();
                break;
            case 'Exit':
                connection.end();
                break;
            default:
                console.log('Invalid action. Please try again.');
                await startApp();
                break;
        }
    } catch (err) {
        console.error('An error occurred:', err);
        connection.end();
        process.exit(1);
    }
}

// View all departments
async function viewDepartments() {
    const query = 'SELECT * FROM departments';
    try {
        const [rows] = await connection.promise().query(query);
        console.table(rows);
    } catch (err) {
        console.error('An error occurred while retrieving departments:', err);
    }
    await startApp();
}

// View all roles
async function viewRoles() {
    const query = `
    SELECT roles.id, roles.title, roles.salary, departments.name AS department
    FROM roles
    INNER JOIN departments ON roles.department_id = departments.id
  `;
    try {
        const [rows] = await connection.promise().query(query);
        console.table(rows);
    } catch (err) {
        console.error('An error occurred while retrieving roles:', err);
    }
    await startApp();
}

// View all employees
async function viewEmployees() {
    const query = `
    SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, CONCAT(managers.first_name, ' ', managers.last_name) AS manager
    FROM employees
    INNER JOIN roles ON employees.role_id = roles.id
    INNER JOIN departments ON roles.department_id = departments.id
    LEFT JOIN employees AS managers ON employees.manager_id = managers.id
  `;
    try {
        const [rows] = await connection.promise().query(query);
        console.table(rows);
    } catch (err) {
        console.error('An error occurred while retrieving employees:', err);
    }
    await startApp();
}

// Add a department
async function addDepartment() {
    try {
        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter the name of the department:',
                validate: (input) => {
                    if (input.trim() === '') {
                        return 'Please enter a valid department name.';
                    }
                    return true;
                },
            },
        ]);

        const query = 'INSERT INTO departments SET ?';
        await connection.promise().query(query, { name: answer.name });
        console.log('Department added successfully!');
    } catch (err) {
        console.error('An error occurred while adding a department:', err);
    }
    await startApp();
}

// Add a role
async function addRole() {
    try {
        const [departments] = await connection.promise().query('SELECT * FROM departments');
        const choices = departments.map((department) => ({
            name: department.name,
            value: department.id,
        }));

        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the name of the role:',
                validate: (input) => {
                    if (input.trim() === '') {
                        return 'Please enter a valid role name.';
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for the role:',
                validate: (input) => {
                    if (isNaN(input)) {
                        return 'Please enter a valid salary.';
                    }
                    return true;
                },
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select the department for the role:',
                choices,
            },
        ]);

        const query = 'INSERT INTO roles SET ?';
        await connection.promise().query(query, {
            title: answer.title,
            salary: answer.salary,
            department_id: answer.departmentId,
        });
        console.log('Role added successfully!');
    } catch (err) {
        console.error('An error occurred while adding a role:', err);
    }
    await startApp();
}

// Add an employee
async function addEmployee() {
    try {
        const [roles] = await connection.promise().query('SELECT * FROM roles');
        const [managers] = await connection.promise().query('SELECT * FROM employees WHERE manager_id IS NULL');

        const choices = [
            { name: 'None', value: null },
            ...managers.map((manager) => ({
                name: `${manager.first_name} ${manager.last_name}`,
                value: manager.id,
            })),
        ];

        const answer = await inquirer.prompt([
            {
                type: 'input',
                name: 'firstName',
                message: "Enter the employee's first name:",
                validate: (input) => {
                    if (input.trim() === '') {
                        return "Please enter the employee's first name.";
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'lastName',
                message: "Enter the employee's last name:",
                validate: (input) => {
                    if (input.trim() === '') {
                        return "Please enter the employee's last name.";
                    }
                    return true;
                },
            },
            {
                type: 'list',
                name: 'roleId',
                message: "Select the employee's role:",
                choices: roles.map((role) => ({
                    name: role.title,
                    value: role.id,
                })),
            },
            {
                type: 'list',
                name: 'managerId',
                message: "Select the employee's manager (optional):",
                choices,
            },
        ]);

        const query = 'INSERT INTO employees SET ?';
        await connection.promise().query(query, {
            first_name: answer.firstName,
            last_name: answer.lastName,
            role_id: answer.roleId,
            manager_id: answer.managerId,
        });
        console.log('Employee added successfully!');
    } catch (err) {
        console.error('An error occurred while adding an employee:', err);
    }
    await startApp();
}

// Update an employee role
async function updateEmployeeRole() {
    try {
        const [employees] = await connection.promise().query('SELECT * FROM employees');
        const [roles] = await connection.promise().query('SELECT * FROM roles');

        const employeeChoices = employees.map((employee) => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id,
        }));

        const roleChoices = roles.map((role) => ({
            name: role.title,
            value: role.id,
        }));

        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select the employee to update:',
                choices: employeeChoices,
            },
            {
                type: 'list',
                name: 'roleId',
                message: 'Select the new role for the employee:',
                choices: roleChoices,
            },
        ]);

        const query = 'UPDATE employees SET role_id = ? WHERE id = ?';
        await connection.promise().query(query, [answer.roleId, answer.employeeId]);
        console.log('Employee role updated successfully!');
    } catch (err) {
        console.error('An error occurred while updating an employee role:', err);
    }
    await startApp();
}  