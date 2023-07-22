const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error '${error.message}'`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const convertDataIntoResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};
//API 1
app.get("/todos/", async (request, response) => {
  const { search_q = " ", priority, status, category } = request.query;
  let data = null;
  let getTodosQuery;

  switch (true) {
    case hasStatusAndPriorityProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
                SELECT *
                FROM todo 
                WHERE status = '${status}'
                    AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((each) => convertDataIntoResponseObject(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //has category and status property
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        status = '${status}'
        AND category = '${category}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((each) => convertDataIntoResponseObject(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    //has category and priority
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                     priority = '${priority}'
                    AND category = '${category}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((each) => convertDataIntoResponseObject(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    //has status property
    case hasStatusProperties(request.query):
      console.log(status);

      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((each) => convertDataIntoResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;

    //has search property
    case hasSearchProperty(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((each) => convertDataIntoResponseObject(each)));
      break;
    //has priority only
    case hasPriorityProperties(request.query):
      console.log(priority);
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
                SELECT
                    *
                FROM
                    todo 
                WHERE
                    priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((each) => convertDataIntoResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasCategoryProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((each) => convertDataIntoResponseObject(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `select * from todo;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((each) => convertDataIntoResponseObject(each)));
  }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id = '${todoId}';`;
  const dbres = await db.get(getTodoQuery);
  response.send(convertDataIntoResponseObject(dbres));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const dateQuery = `
    SELECT * FROM todo
    WHERE due_date = '${newDate}';
    `;

    const dbRes = await db.all(dateQuery);

    response.send(dbRes.map((each) => convertDataIntoResponseObject(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
                    VALUES (
                        '${id}','${todo}','${priority}','${status}','${category}','${newDueDate}');`;
          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn;
  const requestBody = request.body;

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodo;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `
            UPDATE todo 
            SET todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
            WHERE id = '${todoId}'; `;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `
            UPDATE todo 
            SET todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
            WHERE id = '${todoId}'; `;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Updating todo
    case requestBody.todo !== undefined:
      updateTodo = `
            UPDATE todo 
            SET todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
            WHERE id = '${todoId}'; `;
      await db.run(updateTodo);
      response.send("Todo Updated");
      break;
    //updating category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `
            UPDATE todo 
            SET todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
            WHERE id = '${todoId}'; `;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //updating due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodo = `
            UPDATE todo 
            SET todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${newDueDate}'
            WHERE id = '${todoId}'; `;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id = ${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
