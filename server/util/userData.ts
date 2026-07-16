const { faker } = require('@faker-js/faker');


module.exports = function () {

    this.randomName = faker.name.findName();
    this.randomEmail = faker.internet.email(this.randomName, null, 'test.com');
    this.randomCpf = faker.datatype.number({ min: 10000000000, max: 99999999999 });
    this.randomRg = faker.datatype.number({ min: 100000000, max: 999999999 });
    this.randomBirthDate = faker.date.past(80, '01-01-2020');
    this.randomPhone = faker.phone.phoneNumber('## #####-####');
    this.randomAddress = faker.address.streetAddress();
    this.randomAddressCity = faker.address.city();
    this.randomAddressState = faker.address.state()
}

