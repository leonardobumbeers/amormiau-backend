const fetch = require('cross-fetch');
const fs = require('mz/fs');
const catData = require('../util/catData');
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
    global.token = responseToken.accessToken;
})


describe('Testing cats CRUD', () => {

    test.only('should register a new cat', async () => {

        const cat = new catData();
        const filePath = `${__dirname}/tmp/uploads/cat.jpg`;




                const response = await fetch(`${global.url}/admin/registerCat`, {
                    method: 'POST',
                    headers: {
                        // 'Content-Type': 'application/json',
                        'x-access-token': global.token
                    },
                    body: JSON.stringify({
                        name: cat.randomName,
                        birthDate: cat.randomBirthDate,
                        weight: cat.randomWeight,
                        sterilized: cat.randomSterilized,
                        specialCat: cat.randomSpecialCat,
                        description: cat.randomDescription,
                        available: cat.randomAvailable,
                        images: [{
                            fileName: 'cat.jpg',
                            key: 'cat.jpg',
                            size: '123',
                            dest: filePath
                        }]
                        // ,
                        // images: [
                        //     {   
                        //         null,
                        //         null,
                        //     } 
                        // ]      
                    })
                })
                const responseBody = await response.json()
                expect(response.status).toBe(200)
                expect(responseBody.data.name).toBe(cat.randomName)
                expect(responseBody.message).toBe('Cat is registered successfully')

                const catId = responseBody.data._id
                global.catId = catId;
            })
    })

    test('should get registered cat by id', async () => {

        const response = await fetch(`${global.url}/admin/cat/${global.catId}`, {
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

    test('should update registered cat by id', async () => {

        const cat = new catData();

        const response = await fetch(`${global.url}/admin/cat/${global.catId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            },
            body: JSON.stringify({
                name: cat.randomName,
                birthDate: cat.randomBirthDate,
                weight: cat.randomWeight,
                sterilized: cat.randomSterilized,
                specialCat: cat.randomSpecialCat,
                description: cat.randomDescription,
                available: cat.randomAvailable
            })
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data).toBeTruthy()
        // expect(responseBody.message).toBe('cat has been updated successfully!')

    })

    test('should delete registered cat by id', async () => {
        const response = await fetch(`${global.url}/admin/cat/${global.catId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            }
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.data).toBeNull()
        expect(responseBody.message).toBe('Cat is deleted successfully')
    })



    test('should return a list of all cats', async () => {
        const response = await fetch(`${global.url}/admin/cats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.token
            }
        })
        const cats = await response.json();
        expect(response.status).toBe(200);
        expect(cats.data).toBeTruthy();
    });
});
