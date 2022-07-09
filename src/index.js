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

app.get("/statement", verifyIfCustomerExist, (request, response) => {
    const { customer } = request;
    return response.json(customer.statement);
})


app.listen(3333);