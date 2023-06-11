/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('apactivities', function(t) {
        t.datetime("published").nullable().alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('apactivities', function(t) {
        t.datetime("published").notNullable().defaultTo(knex.fn.now()).alter();
    }); 
};
