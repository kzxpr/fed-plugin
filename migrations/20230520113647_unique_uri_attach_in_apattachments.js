/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('apattachments', function (table) {
        table.unique(["message_uri", "url"])
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('apattachments', function (table) {
        table.dropUnique(["message_uri", "url"])
    })
};
