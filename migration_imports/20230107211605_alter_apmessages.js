/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable('apmessages', function (table) {
        table.string("uri").notNullable().defaultTo("").alter();
        table.datetime("createdAt").notNullable().defaultTo(knex.fn.now()).alter();
        table.unique("uri")
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable('apmessages', function (table) {
        table.string("uri").nullable().alter();
        table.datetime("createdAt").nullable().alter();
        table.dropUnique("uri")
    })
};
