/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('apaccounts_tags', function(t) {
        t.increments('id').unsigned().primary();
        t.string('user_uri').notNull();
        t.string('type').notNull();
        t.string('name').notNull();
        t.string('href').nullable();
        t.string('icon_type').nullable();
        t.string('icon_url').nullable();
        t.string('icon_mediatype').nullable();
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable("apaccounts_tags")
};
