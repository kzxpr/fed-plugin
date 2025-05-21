/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('apfollowers', function(t) {
        t.string('follow_activity_uri').nullable();
        t.string('accept_activity_uri').nullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('apfollowers', function(t) {
        t.dropColumn('follow_activity_uri');
        t.dropColumn('accept_activity_uri');
    });
};
