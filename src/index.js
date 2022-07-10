const { response } = require('express');
const express = require('express');
const { v4: uuidV4 } = require('uuid')

const app = express();

app.use(express.json());

const customers = [];

function verifyIfCustomerExist(request, response, next) {
    const { nif } = request.headers;
    const customer = customers.find((customer) => customer.nif === nif)
    if (!customer) return response.json({ error: "Customer not found" });
    request.customer = customer;
    return next();
}

function getBalance(statements) {
    const balance = statements.reduce((acc, statement) => {
        if (statement.type === "credit") {
            return acc + statement.amount;
        } else {
            return acc - statement.amount;
        }
    }, 0);
    return balance;
}

app.post("/account", (request, response) => {
    const { nif, name } = request.body;
    const customerAlreadyExist = customers.some((customer) => customer.nif === nif)
    if (customerAlreadyExist) {
        return response.status(400).json({ error: "Customer already exist !" })
    }
    customers.push({
        id: uuidV4(),
        nif,
        name,
        statement: []
    })
    return response.status(201).json({ customers: customers });
})

app.get("/account", verifyIfCustomerExist, (request, response) => {
    const { customer } = request;
    return response.json(customer);
})

app.put("/account", verifyIfCustomerExist, (request, response) => {
    const { customer } = request;
    const { name } = request.body;
    customer.name = name;
    return response.status(201).json(customer);
})

app.get("/statement", verifyIfCustomerExist, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
})

app.get("/statement/date", verifyIfCustomerExist, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");
    const statements = customer.statement.filter(statement => statement.created_At.toDateString() === new Date(dateFormat).toDateString())
    return response.json({ statements });
})

app.post("/deposit", verifyIfCustomerExist, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const operation = {
        description,
        amount,
        created_At: new Date(),
        type: "credit"
    }
    customer.statement.push(operation);
    return response.status(201).send();
})

app.post("/withdraw", verifyIfCustomerExist, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;
    const balance = getBalance(customer.statement);
    if (balance < amount) {
        return response.status(400).json({ error: "Insuficiente founds" })
    }
    const operation = {
        amount,
        created_At: new Date(),
        type: "debit"
    }
    customer.statement.push(operation);
    return response.status(201).send();
})

app.listen(3333);