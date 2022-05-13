const { faker } = require('@faker-js/faker');


module.exports = function () {

    this.randomName = faker.name.firstName();
    this.randomBirthDate = faker.date.past(15, '01-01-2020');
    this.randomWeight = faker.datatype.float({ min: 1, max: 15, precision: 0.01 }) + 'kg';
    this.randomSterilized = faker.datatype.boolean();
    this.randomSpecialCat = faker.datatype.boolean();
    this.randomDescription = faker.lorem.sentences();
    this.randomAvailable = faker.datatype.boolean();
    this.randomSociable = faker.datatype.integer({ min: 0, max: 5 });
    this.randomPlayful = faker.datatype.integer({ min: 0, max: 5 });
    this.randomAffectionate = faker.datatype.integer({ min: 0, max: 5 });
}

