/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('aptags_channels', function (table) {
        table.unique(["name", "href"])
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('aptags_channels', function (table) {
        table.dropUnique(["name", "href"])
    })
};
