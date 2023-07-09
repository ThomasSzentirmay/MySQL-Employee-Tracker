const inquirer = require('inquirer');
const mysql = require('mysql2');

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'employee_tracker',
});

// Connect to the database
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the employee_tracker database.');
  startApp();
});

// Prompt the user to choose an action
function startApp() {
  inquirer
    .prompt([
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
    ])
    .then((answer) => {
      switch (answer.action) {
        case 'View all departments':
          viewDepartments();
          break;
        case 'View all roles':
          viewRoles();
          break;
        case 'View all employees':
          viewEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
        case 'Exit':
          connection.end();
          break;
        default:
          console.log('Invalid action. Please try again.');
          startApp();
          break;
      }
    });
}

// View all departments
function viewDepartments() {
  connection.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;
    console.table(res);
    startApp();
  });
}

// View all roles
function viewRoles() {
  const query =
    'SELECT roles.id, roles.title, roles.salary, departments.name AS department FROM roles ' +
    'INNER JOIN departments ON roles.department_id = departments.id';

  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    startApp();
  });
}

// View all employees
function viewEmployees() {
  const query =
    'SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, ' +
    'roles.salary, CONCAT(managers.first_name, " ", managers.last_name) AS manager ' +
    'FROM employees ' +
    'INNER JOIN roles ON employees.role_id = roles.id ' +
    'INNER JOIN departments ON roles.department_id = departments.id ' +
    'LEFT JOIN employees AS managers ON employees.manager_id = managers.id';

  connection.query(query, (err, res) => {
    if (err) throw err;
    console.table(res);
    startApp();
  });
}

// Add a department
function addDepartment() {
  inquirer
    .prompt([
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
    ])
    .then((answer) => {
      connection.query(
        'INSERT INTO departments SET ?',
        { name: answer.name },
        (err) => {
          if (err) throw err;
          console.log('Department added successfully!');
          startApp();
        }
      );
    });
}

// Add a role
function addRole() {
  connection.query('SELECT * FROM departments', (err, departments) => {
    if (err) throw err;

    inquirer
      .prompt([
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
          choices: departments.map((department) => ({
            name: department.name,
            value: department.id,
          })),
        },
      ])
      .then((answer) => {
        connection.query(
          'INSERT INTO roles SET ?',
          {
            title: answer.title,
            salary: answer.salary,
            department_id: answer.departmentId,
          },
          (err) => {
            if (err) throw err;
            console.log('Role added successfully!');
            startApp();
          }
        );
      });
  });
}

// Add an employee
function addEmployee() {
  connection.query('SELECT * FROM roles', (err, roles) => {
    if (err) throw err;

    connection.query(
      'SELECT * FROM employees WHERE manager_id IS NULL',
      (err, managers) => {
        if (err) throw err;

        inquirer
          .prompt([
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
              message: "Select the employee's manager:",
              choices: [
                { name: 'None', value: null },
                ...managers.map((manager) => ({
                  name: `${manager.first_name} ${manager.last_name}`,
                  value: manager.id,
                })),
              ],
            },
          ])
          .then((answer) => {
            connection.query(
              'INSERT INTO employees SET ?',
              {
                first_name: answer.firstName,
                last_name: answer.lastName,
                role_id: answer.roleId,
                manager_id: answer.managerId,
              },
              (err) => {
                if (err) throw err;
                console.log('Employee added successfully!');
                startApp();
              }
            );
          });
      }
    );
  });
}

// Update an employee role
function updateEmployeeRole() {
  connection.query('SELECT * FROM employees',(err, employees) => {
    if (err) throw err;

    connection.query('SELECT * FROM roles', (err, roles) => {
      if (err) throw err;

      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employeeId',
            message: 'Select the employee to update:',
            choices: employees.map((employee) => ({
              name: `${employee.first_name} ${employee.last_name}`,
              value: employee.id,
            })),
          },
          {
            type: 'list',
            name: 'roleId',
            message: 'Select the new role for the employee:',
            choices: roles.map((role) => ({
              name: role.title,
              value: role.id,
            })),
          },
        ])
        .then((answer) => {
          connection.query(
            'UPDATE employees SET role_id = ? WHERE id = ?',
            [answer.roleId, answer.employeeId],
            (err) => {
              if (err) throw err;
              console.log('Employee role updated successfully!');
              startApp();
            }
          );
        });
    });
  });
}