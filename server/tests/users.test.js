const fetch = require('cross-fetch');
const userData = require('../util/userData');
require("dotenv/config");

beforeAll(async () => {
    const URL = 'https://amormiau-backend.herokuapp.com'
    global.url = URL
    const responseLogin = await fetch(`${global.url}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD
        })
    })
    const responseToken = await responseLogin.json()
    return global.token = responseToken.accessToken;  
})

describe('Testing users CRUD', () => {

    test('should register a new user', async () => {

        const user = new userData();

        const response = await fetch(`${global.url}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: user.randomName,
                email: user.randomEmail,
                password: '123456',
                cpf: user.randomCpf,
                rg: user.randomRg,
                birthDate: user.randomBirthDate,
                phone: user.randomPhone,
                address: user.randomAddress,
                city: user.randomAddressCity,
                state: user.randomAddressState
                // role: ""
            })
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data.name).toBe(user.randomName)
        expect(responseBody.data.email).toBe(user.randomEmail)
        expect(responseBody.message).toBe('You have signed up successfully')

        const userId = responseBody.data._id
        global.userId = userId;

    })

    test('should get registered user by id', async () => {

        const response = await fetch(`${global.url}/admin/user/${global.userId}`, {
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

    test('should update registered user by id', async () => {

        const user = new userData();

        const response = await fetch(`${global.url}/admin/user/${global.userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            },
            body: JSON.stringify({
                name: user.randomName,
                email: user.randomEmail,
                password: '123456',
                cpf: user.randomCpf,
                rg: user.randomRg,
                birthDate: user.randomBirthDate,
                phone: user.randomPhone,
                address: user.randomAddress,
                city: user.randomAddressCity,
                state: user.randomAddressState
                // role: ""
            })
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data).toBeTruthy()
        expect(responseBody.message).toBe('User has been updated successfully!')

    })

    test('should delete registered user by id', async () => {
        const response = await fetch(`${global.url}/admin/user/${global.userId}`, {
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



    test('should return a list of all users', async () => {
        const response = await fetch(`${global.url}/admin/users`, {
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
