const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const monthnames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function fillWithZero(str, len){
    var countstr = str.toString();
    return "0".repeat(len - countstr.length)+str;
}

function sum(a,b){
    return (a+b)
}

function neq(arg1, arg2, options) {
    return (arg1 != arg2) ? true : false;
}

function eq(arg1, arg2, options) {
    return (arg1 == arg2) ? true : false;
}

function prettydatetime(datetime) {
    if(datetime){
        const my_date = new Date(datetime)
        return my_date.getDate() + "/" + (my_date.getMonth() + 1) + "-" + my_date.getFullYear() + " " + my_date.getHours() + ":" + fillWithZero(my_date.getMinutes(), 2) + ":" + fillWithZero(my_date.getSeconds(), 2);
    }else{
        return;
    }
}

function gt(arg1, arg2, options) {
    return (arg1 > arg2) ? true : false;
}

function lt(arg1, arg2, options) {
    return (arg1 < arg2) ? true : false;
}

function notempty(arg1){
    return (arg1 != "" && arg1 !== null)
}

function notnull(arg1) {
    return arg1 !== null;
}

function count(arr){
    if(arr){
        return arr.length;
    }else{
        return null;
    }
}

function parseJSON(str){
    return JSON.parse(str);
}

function prettyJSON(src){
    return JSON.stringify(JSON.parse(src), undefined, 4)
}

function setVar(varName, varValue, options) {
    options.data.root[varName] = varValue;
}

function substr(str, from, len = 0){
    if(str){
        if(len!=0){
            return str.substr(from, len);
        }else{
            return str.substr(from)
        }
    }else{
        return "";
    }
}

function onlyUnique(value, index, array) {
    // HOW TO USE:
    // var unique = a.filter(onlyUnique);
    return array.indexOf(value) === index;
}

const { DateTime } = require("luxon");

function date2mysql(dd_str){
    var d = new Date(dd_str)
    var str = DateTime.fromISO(d.toISOString()).toString();
	str = str.slice(0, 19).replace('T', ' ');
	return str;
}

function isJSON(str) {
    try {
        return (JSON.parse(str) && !!str);
    } catch (e) {
        return false;
    }
}

function dynamicDate(date, breakline = true){
	const dd = new Date(date);
	const now = new Date();
	const diff = now.getTime() - dd.getTime();
	const daynames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
	const datestr = daynames[dd.getDay()]+" "+dd.getDate()+"/"+(dd.getMonth()+1)+"-"+dd.getFullYear();
	const timestr = dd.getHours()+":"+fillWithZero(dd.getMinutes(), 2);
	if(diff < (60 * 1000)){ // less than 1 minutes
		return "Just now"
	}else if(diff < (60 * 60 * 1000)){ // less than 59 minutes
		return Math.floor(diff/60000)+" minutes ago"
	}else if(diff < (24 * 60 * 60 * 1000)){ // less than 24 hours
		return Math.floor(diff/(60000*60))+" hours ago"
	}else if(diff < (7 * 24 * 60 * 60 * 1000)){ // less than 7 days
		return Math.floor(diff/(60000*60*24))+" days ago"
	}else{
        if(breakline){
            return datestr+"<br>"+timestr;
        }else{
            return datestr+" "+timestr;
        }
	}
}

function prettyDatetime(datetime) {
	if(datetime){
		const my_date = new Date(datetime)
		return days[my_date.getDay()] + " " + my_date.getDate() + " " + monthnames[my_date.getMonth()] + " " + my_date.getFullYear() + " " + my_date.getHours() + ":" + fillWithZero(my_date.getMinutes(), 2);
	}else{
		return;
	}
}

function skipHTMLTags(text) {
    var result = '';
    var tagOpen = false;
  
    for (var i = 0; i < text.length; i++) {
      if (text[i] === '<') {
        tagOpen = true;
      } else if (text[i] === '>') {
        tagOpen = false;
        continue;
      }
  
      if (!tagOpen) {
        result += text[i];
      }
    }
  
    return result;
}  

module.exports = { sum, neq, eq, prettydatetime, gt, lt, count, fillWithZero, prettyJSON, notnull, notempty, parseJSON, setVar, substr, onlyUnique, date2mysql, isJSON, dynamicDate, prettyDatetime, skipHTMLTags }