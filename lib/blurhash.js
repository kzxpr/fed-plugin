// BASED ON:
// https://github.com/woltapp/blurhash/tree/master/TypeScript

const { encode, decode } = require("blurhash")
const { createCanvas, Image, loadImage } = require('canvas')

async function getImageData(src){
    return new Promise((resolve, reject) => {
        loadImage(src).then((image) => {
            const canvas = createCanvas(image.width, image.height)
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            resolve(context.getImageData(0, 0, image.width, image.height))
        })
        .catch((e) => {
            console.error("ERROR while making blurhash:", e)
            reject("BUH")
        })
    });
}

async function encodeImageToBlurhash(imageUrl){
    return new Promise(async(resolve, reject) => {
        if(imageUrl && imageUrl != "https://dev2.hackademiet.dk/public/"){
            await getImageData(imageUrl)
            .then((imageData) => {
                const blurhash = encode(imageData.data, imageData.width, imageData.height, 4, 4);
                const width = imageData.width;
                const height = imageData.height;
                resolve({ blurhash, width, height })
            })
            .catch((e) => {
                reject(e)
            })
        }
    })
};

function decodeImageFromBlurhash(blur, width, height){
    // "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
    const pixels = decode(blur, width, height);

    //const canvas = document.createElement("canvas");
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL()
}

module.exports = { encodeImageToBlurhash, decodeImageFromBlurhash }