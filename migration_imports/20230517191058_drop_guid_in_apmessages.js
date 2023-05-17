/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('apmessages', function(t) {
        t.dropColumn("guid")
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
      return knex.schema.table('apmessages', function(t) {
        t.string('guid').notNull();
        t.unique('guid')
    });
  };
  