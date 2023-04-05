const { prettyJSON, prettydatetime } = require("../../../funcs")

function pageLogs(logs){
    var body = `<table style="font-size: 10pt;">
        <thead>
            <tr>
                <td>method</td>
                <td>url</td>
                <td>ip</td>
                <td>timestamp</td>
                <td>statuscode</td>
                <td>body</td>
                <td>response</td>
            </tr>
        </thead>
        <tbody>`
    for(let log of logs){
        body += `<tr>
            <td>`+log.method+`</td>
            <td>`+log.url+`</td>
            <td>`+log.ip+`</td>
            <td>`+prettydatetime(log.timestamp)+`</td>
            <td>`+log.statuscode+`</td>
            <td>`;
        if(log.body == "{}"){
            body += "<i>empty</i>"
        }else{
            body += "<a href='/ap/admin/logs/"+log.id+"' title='"+prettyJSON(log.body)+"'>{body}</a>";
        }
        body += `</td><td>`
        if(log.response){
            body += "<a href='/ap/admin/logs/"+log.id+"' title='"+prettyJSON(log.response)+"'>{response}</a>";
        }else{
            body += "<i>empty</i>"
        }
        body += `</td></tr>`
    }
    body += `</tbody></table>`
    return body;
}

function logItem(log){
    return `<a href="/ap/admin/logs">Back</a><br>
    <table>
        <thead>
            <tr>
                <td>field</td>
                <td>value</td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>method</td>
                <td>`+log.method+`</td>
            </tr>
            <tr>
                <td>url</td>
                <td>`+log.url+`</td>
            </tr>
            <tr>
                <td>ip</td>
                <td>`+log.ip+`</td>
            </tr>
            <tr>
                <td>timestamp</td>
                <td>`+prettydatetime(log.timestamp)+`</td>
            </tr>
            <tr>
                <td>statuscode</td>
                <td>`+log.statuscode+`</td>
            </tr>
            <tr>
                <td>body</td>
                <td><pre>`+prettyJSON(log.body)+`</pre></td>
            </tr>
            <tr>
                <td>response</td>
                <td><pre>`+prettyJSON(log.response)+`</pre></td>
            </tr>
        </tbody>
    </table>`
}

module.exports = { pageLogs, logItem }