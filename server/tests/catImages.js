var supertest = require('supertest');
var req = supertest('POST', 'localhost:3000/admin/registerCat')
  .set('x-access-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MjI5MjczZTBkYTlkZTZmZjc3OTU0MjAiLCJpYXQiOjE2NDc5MDEzNjEsImV4cCI6MTY0Nzk4Nzc2MX0.fV6BD0rZpbdJNJAtvLQoUWXEOSdZt2C-_UBZvXfV9gM'
  )
  .field('name', 'Frida')
  .field('birthDate', '2020-10-24')
  .field('weight', '3kg')
  .field('sterilized', 'true')
  .field('specialCat', 'false')
  .field('description', 'Linda gatinha cinza rajada')
  .field('available', 'false')
  .attach('file', '/Users/leonardo.souza/Downloads/cat.jpeg')
  .end(function (res) {
    if (res.error) throw new Error(res.error);
    console.log(res.raw_body);
  });