const { encodeStr } = require("./server/fed-plugin/lib/addAccount")

function test() {
    const str = "ch 🍑 N ▇ I S B ▇ B";
    const encstr = encodeStr(str)
    console.log(encstr)
    /*await knex("test").insert({ text: encstr })
    .then((d) => {
        console.log("SUCCESS!")
    })
    .catch((e) => {
        console.error(e)
    })
    res.send("OK")*/
}