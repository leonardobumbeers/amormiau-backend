const fetch = require('cross-fetch');
const fs = require('mz/fs');
const path = require('path');
const FormData = require('form-data');
const supertest = require('supertest');
const catData = require('../util/catData');
const { grantAccess, clearDatabase } = require('../util/grantAccess');
require("dotenv/config");

beforeAll(async () => {
    const URL = 'http://localhost:3000'
    // const URL = 'https://amormiau-backend.herokuapp.com'
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


describe('Testing cats CRUD', () => {
    jest.setTimeout(30000);

    test('should register a new cat', async () => {

        const cat = new catData();
        const filePath = path.join(__dirname, '../../tmp/uploads/img.example.jpg');


        const response = await supertest(global.url)
            .post('/admin/registerCat')
            .set('x-access-token', global.accessToken)
            .set('content-Type', 'multipart/form-data')
            .field('name', cat.randomName)
            .field('birthDate', `${cat.randomBirthDate}`)
            .field('weight', cat.randomWeight)
            .field('sterilized', cat.randomSterilized)
            .field('specialCat', cat.randomSpecialCat)
            .field('description', cat.randomDescription)
            .field('available', cat.randomAvailable)
            .field('sociable', cat.randomSociable)
            .field('playful', cat.randomPlayful)
            .field('affectionate', cat.randomAffectionate)
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
                'x-access-token': global.accessToken
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
                'x-access-token': global.accessToken
            },
            body: JSON.stringify({
                name: cat.randomName,
                birthDate: cat.randomBirthDate,
                weight: cat.randomWeight,
                sterilized: cat.randomSterilized,
                specialCat: cat.randomSpecialCat,
                description: cat.randomDescription,
                available: cat.randomAvailable,
                sociable: cat.randomSociable,
                playful: cat.randomPlayful,
                affectionate: cat.randomAffectionate
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
                'x-access-token': global.accessToken
            }
        })
        const responseBody = await response.json()
        expect(response.status).toBe(200)
        expect(responseBody.message).toBe('Cat is deleted successfully')
    })



    test('should return a list of all cats', async () => {
        const response = await fetch(`${global.url}/admin/cats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': global.accessToken
            }
        })
        const cats = await response.json();
        expect(response.status).toBe(200);
        expect(cats.data).toBeTruthy();
    });
});

