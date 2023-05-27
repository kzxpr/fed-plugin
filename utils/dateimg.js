const express = require('express');
const router = express.Router();

const { createCanvas, loadImage } = require('canvas')

router.get("/:input", (req, res) => {
    const { input } = req.params;
    var dd;
    if(input){
        dd = new Date(input);
    }else{
        dd = new Date();
    }
    
    const daynames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayname = daynames[dd.getDay()]
    const day = dd.getDate();
    const month = dd.getMonth() + 1;
    const year = dd.getFullYear();
    const hour = dd.getHours();
    const minutes = dd.getMinutes();

    const canvas = createCanvas(200, 200)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = "rgb(207, 209, 196)";
    ctx.rect(0, 0, 200, 200)
    ctx.fill();

    ctx.fillStyle = "black";
    
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = '30px Impact'
    ctx.fillText(dayname, 100, 40)

    ctx.font = '30px Impact'
    ctx.fillText(year, 100, 160)
    
    ctx.font = '65px Impact'
    ctx.fillText(day + "/" + month, 100, 100)
    
    /*ctx.font = '90px Impact'
    ctx.fillText("/", 100, 100)

    ctx.textAlign = "right";
    ctx.font = '65px Impact'
    ctx.fillText(day, 90, 90)

    ctx.textAlign = "left";
    ctx.fillText(month, 110, 115)*/

    //ctx.font = '30px Impact'
    //ctx.fillText(hour+":"+minutes, 100, 160)

    res.setHeader('Content-Type', 'image/png');
    canvas.pngStream().pipe(res);
})

module.exports = router;