const fetch = require('cross-fetch');
const userData = require('../util/userData');
const { grantAccess, clearDatabase } = require('../util/grantAccess');
require("dotenv/config");

beforeAll(async () => {
    const URL = 'http://localhost:3000'
    global.url = URL
    await grantAccess.then((result) => {
        global.accessToken = result.accessToken;
    }).catch((err) => {
        console.log('err: ' + err);
    })
})

afterAll(async () => {
    await clearDatabase();
})

describe('Testing users CRUD', () => {

    it('should register a new user', async () => {

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

    it('should get registered user by id', async () => {

        const response = await fetch(`${global.url}/admin/user/${global.userId}`, {
            // const response = await fetch(`${global.url}/admin/user/623bc14fabce1a49ea963c6e`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.accessToken
            }
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data).toBeTruthy()
    })

    it('should update registered user by id', async () => {

        const user = new userData();

        const response = await fetch(`${global.url}/admin/user/${global.userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.accessToken
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

    it('should delete registered user by id', async () => {
        const response = await fetch(`${global.url}/admin/user/${global.userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.accessToken
            }
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data).toBeNull()
        expect(responseBody.message).toBe('User has been deleted')
    })



    it('should return a list of all users', async () => {
        const response = await fetch(`${global.url}/admin/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.accessToken

            }
        })
        const users = await response.json();
        expect(response.status).toBe(200);
        expect(users.data).toBeTruthy();
    });
});
