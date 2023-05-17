/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('aptags_channels', function(t) {
        t.increments('id').unsigned().primary();
        t.string('name').notNull();
        t.string('href').notNull();
        t.dateTime('createdAt').notNull();
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable("aptags_channels")
};
