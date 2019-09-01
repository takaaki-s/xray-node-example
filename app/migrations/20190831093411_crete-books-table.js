exports.up = async function(knex) {
  await knex.schema.createTable('books', table => {
    table
      .increments('id')
      .unsigned()
      .primary();
    table.integer('author_id').unsigned().notNullable();
    table.string('title').notNullable();
    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('books');
};
