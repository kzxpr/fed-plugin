/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('apaccounts_tags', function (table) {
        table.unique(["user_uri", "type", "name"])
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('apaccounts_tags', function (table) {
        table.dropUnique(["user_uri", "type", "name"])
    })
};
