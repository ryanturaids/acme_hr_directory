const express = require("express");
const app = express();
const pg = require("pg");
const port = "3000";

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

app.use(express.json());
app.use(require("morgan")("dev"));

// get employees
app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
    SELECT *
    FROM employee;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
// get departments
app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `
    SELECT *
    FROM department;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});
// post new employees
app.post("/api/employees", async (req, res, next) => {
  try {
    const { name, department_id } = req.body;
    const SQL = `
    INSERT INTO employee (name, department_id)
    VALUES ($1, $2)
    RETURNING *;
    `;
    const response = await client.query(SQL, [name, department_id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
// delete employee
app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const SQL = `
    DELETE FROM employee
    WHERE id=$1;
    `;
    const response = await client.query(SQL, [id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
// update employee
app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const { name, department_id } = req.body;
    const id = Number(req.params.id);
    const SQL = `
    UPDATE employee
    SET name = $1, department_id = $2, updated_at = now()
    WHERE id = $3
    RETURNING *;
    `;
    const response = await client.query(SQL, [name, department_id, id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
const init = async () => {
  await client.connect();
  console.log("server started");
  let SQL = `
  DROP TABLE IF EXISTS department CASCADE;
  DROP TABLE IF EXISTS employee CASCADE;
  CREATE TABLE department(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
  );
  CREATE TABLE employee(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES department(id) NOT NULL
  );
  `;
  await client.query(SQL);
  console.log("created tables");
  SQL = `
  INSERT INTO department(name) VALUES('Engineering');
  INSERT INTO department(name) VALUES('Marketing');
  INSERT INTO department(name) VALUES('Sales');
  INSERT INTO department(name) VALUES('Human Resources');

  INSERT INTO employee(name, department_id) VALUES('John Doe', (SELECT id FROM department WHERE name = 'Engineering'));
  INSERT INTO employee(name, department_id) VALUES('Jane Smith', (SELECT id FROM department WHERE name = 'Marketing'));
  INSERT INTO employee(name, department_id) VALUES('Robert Brown', (SELECT id FROM department WHERE name = 'Sales'));
  INSERT INTO employee(name, department_id) VALUES('Emily Davis', (SELECT id FROM department WHERE name = 'Human Resources'));
  INSERT INTO employee(name, department_id) VALUES('Michael Johnson', (SELECT id FROM department WHERE name = 'Marketing'));
  INSERT INTO employee(name, department_id) VALUES('Sarah Wilson', (SELECT id FROM department WHERE name = 'Engineering'));
  INSERT INTO employee(name, department_id) VALUES('David Martinez', (SELECT id FROM department WHERE name = 'Marketing'));
  INSERT INTO employee(name, department_id) VALUES('Linda Anderson', (SELECT id FROM department WHERE name = 'Sales'));
  INSERT INTO employee(name, department_id) VALUES('James Rodriguez', (SELECT id FROM department WHERE name = 'Engineering'));
  INSERT INTO employee(name, department_id) VALUES('Mary Lee', (SELECT id FROM department WHERE name = 'Marketing'));
  `;
  await client.query(SQL);
  console.log("seeded data");
  app.listen(port, () => {
    console.log("server running");
  });
};

init();
