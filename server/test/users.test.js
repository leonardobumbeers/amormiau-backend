const fetch = require('cross-fetch');
const { faker } = require('@faker-js/faker');
const path = require('path')
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

beforeAll(async () => {

    const responseLogin = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: "test@admin.com",
            password: "123456"
        })
    })
    const responseToken = await responseLogin.json()
    global.token = responseToken.accessToken;    
})


describe('Testing users CRUD', () => {

    test('should register a new user', async () => {

        const randomName = faker.name.findName();
        const randomEmail = faker.internet.email(randomName, null, '@test.com');
        const randomPassword = faker.internet.password();
        const randomCpf = faker.random.number({ min: 10000000000, max: 99999999999 });
        const randomRg = faker.random.number({ min: 100000000, max: 999999999 });
        const randomBirthDate = faker.date.past(80, '2020-01-01');
        const randomPhone = faker.phone.phoneNumber('## #####-####');
        const randomAddress = faker.address.streetAddress()
        const randomAddressCity = faker.address.city();
        const randomAddressState = faker.address.state();

        console.log(`
        ${randomName}
        ${randomAddress}
        ${randomAddressCity}
        ${randomAddressState}
        `);

        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: randomName,
                email: randomEmail,
                password: '123456',
                cpf: randomCpf,
                rg: randomRg,
                birthDate: randomBirthDate,
                phone: randomPhone,
                address: randomAddress,
                city: randomAddressCity,
                state: randomAddressState
                // role: ""
            })
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data.name).toBe(randomName)
        expect(responseBody.data.email).toBe(randomEmail)
        expect(responseBody.message).toBe('You have signed up successfully')

        const userId = responseBody.data._id
        global.userId = userId;

    })

    test('should get registered user by id', async () => {

        const response = await fetch(`http://localhost:3000/admin/user/${global.userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            }
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data).toBeTruthy()
    })

    test('should delete registered user by id', async () => {
        const response = await fetch(`http://localhost:3000/admin/user/${global.userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            }
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data).toBeNull()
        expect(responseBody.message).toBe('User has been deleted')
    })

    test('should not update user by id', async () => {
        const response = await fetch(`http://localhost:3000/admin/user/${global.userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            },
            body: JSON.stringify({
                name: '',
                // email: '', // email is required
                // password: '',
                // cpf: '', // cpf is required
                // rg: '', // rg is required
                // birthDate: '', // birthDate is required
                // phone: '', // phone is required
                // address: '', // address is required
                // city: '', // city is required
                // state: '', // state is required
                // role: ""
            })
        })
        const responseBody = await response.json()
        expect(response.status).toBe(500)
    })

    test('should return a list of all users', async () => {
        const response = await fetch('http://localhost:3000/admin/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            }
        })
        const users = await response.json();
        expect(response.status).toBe(200);
        expect(users.data).toBeTruthy();
    });
});