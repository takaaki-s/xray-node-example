exports.up = async function(knex) {
  await knex.schema.createTable('authors', table => {
    table
      .increments('id')
      .unsigned()
      .primary();
    table.string('author_name').notNullable();
    table.timestamps(false, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('authors');
};
