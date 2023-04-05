const db = require("./../../../knexfile")
const knex = require("knex")(db)
crypto = require('crypto');


async function createArticle(name, content, username, domain, link){
  return new Promise(async (resolve, reject) => {
    console.log("/createArticle?")
    const guidNote = crypto.randomBytes(16).toString('hex');
    let d = new Date();

    const user_id = await knex("apaccounts").where("handle", "=", username+"@"+domain).select("id").first()
    .then((d) => {
      return d.id;
    })
    .catch((e) => {
      console.error("ERROR", e)
    })
    const type = "Article";
    const attributedTo = user_id;
  
    let status2 = knex("apmessages")
      .insert({ guid: guidNote, type, publishedAt: knex.fn.now(), attributedTo, name, content, url: link })
      .then((d) => {
        resolve(d)
      })
      .catch(function(e){
          reject(e)
      })
      
  })
}

async function createNote(content, username, domain, link){
  return new Promise(async (resolve, reject) => {
    console.log("/createNote?")
    const guidNote = crypto.randomBytes(16).toString('hex');
    let d = new Date();

    const user_id = await knex("apaccounts").where("handle", "=", username+"@"+domain).select("uri").first()
    .then((d) => {
      return d.uri;
    })
    .catch((e) => {
      console.error("ERROR", e)
    })
    const type = "Note";
    const attributedTo = user_id;
  
    let status2 = knex("apmessages")
      .insert({ guid: guidNote, type, publishedAt: knex.fn.now(), attributedTo, content, url: link })
      .then((d) => {
        resolve(d)
      })
      .catch(function(e){
          reject(e)
      })
      
  })
}

async function createPage(href, content, username, domain){
  return new Promise(async (resolve, reject) => {
    console.log("/createPage")
    const guidNote = crypto.randomBytes(16).toString('hex');
    let d = new Date();

    const user_id = await knex("apaccounts").where("handle", "=", username+"@"+domain).select("id").first()
    .then((d) => {
      return d.id;
    })
    .catch((e) => {
      console.error("ERROR", e)
    })
    const type = "Page";
    const attributedTo = user_id;
  
    let status2 = knex("apmessages")
      .insert({ guid: guidNote, type, publishedAt: knex.fn.now(), attributedTo, content, url: href })
      .then((d) => {
        resolve(d)
      })
      .catch(function(e){
          reject(e)
      })
      
  })
}

module.exports = { createNote, createPage, createArticle }