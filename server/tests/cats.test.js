const fetch = require('cross-fetch');
const fs = require('mz/fs');
const path = require('path');
const FormData = require('form-data');
const supertest = require('supertest');
const catData = require('../util/catData');
const { createReadStream } = require('fs');
require("dotenv/config");

beforeAll(async () => {
    // const URL = 'https://amormiau-backend.herokuapp.com'
    const URL = 'http://localhost:3000'
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

    test('should register a new cat', async () => {

        const cat = new catData();
        const filePath = path.join(__dirname, '../../tmp/uploads/img.example.jpg');


        const response = await supertest(global.url)
            .post('/admin/registerCat')
            .set('x-access-token', global.token)
            .set('content-Type', 'multipart/form-data')
            .field('name', cat.randomName)
            .field('birthDate', `${cat.randomBirthDate}`)
            .field('weight', cat.randomWeight)
            .field('sterilized', cat.randomSterilized)
            .field('specialCat', cat.randomSpecialCat)
            .field('description', cat.randomDescription)
            .field('available', cat.randomAvailable)
            .attach('images', filePath, { filename: 'img.example.jpg', type: 'jpg' })


        const responseText = await response.text;
        const responseJson = JSON.parse(responseText);

        expect(response.status).toBe(200)


        const catId = responseJson.data._id
        global.catId = catId;

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

