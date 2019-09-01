const Faker = require('faker');

exports.seed = async function(knex) {
  Faker.locale = 'ja';

  const fakeBooks = [];
  for (let i = 0; i < 100; i++) {
    fakeBooks.push({
      author_id: Math.floor(Math.random() * 20 + 1),
      title: Faker.commerce.productName(),
    });
  }

  await knex('books').truncate();
  await knex('books').insert(fakeBooks);
};
