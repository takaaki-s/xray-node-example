const Faker = require('faker');

exports.seed = async function(knex) {
  Faker.locale = 'ja';
  const fakeAuthors = [];
  for (let i = 0; i < 20; i++) {
    fakeAuthors.push({
      author_name: Faker.name.lastName() + ' ' + Faker.name.firstName(),
    });
  }

  await knex('authors').truncate();
  await knex('authors').insert(fakeAuthors);
};
