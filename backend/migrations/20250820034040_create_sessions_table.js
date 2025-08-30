/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('sessions', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.integer('port').notNullable();
    table.integer('pid');
    table.string('status').defaultTo('active');
    table.string('shell');
    table.string('working_dir');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_activity').defaultTo(knex.fn.now());
    table.json('metadata');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('sessions');
}
