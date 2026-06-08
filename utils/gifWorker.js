const { promises:fs, createWriteStream } = require("node:fs")
const path = require("node:path")
const { createCanvas, GlobalFonts, loadImage } = require("@napi-rs/canvas")
const gifFrames = require('gif-frames');
const GIFEncoder = require("gif-encoder-2/src/GIFEncoder");

const imgDir =(frameNum)=>{
    let result
    switch (true) {
        case frameNum<24+1:
            result = [205, 90]
            break;
        case frameNum<27+1:
            result = [264, 100]
            break;
        case frameNum<30+1:
            result = [287, 100]
            break;
        case frameNum<32+1:
            result = [306, 100]
            break;
        case frameNum<35+1:
            result = [329, 100]
            break;
        case frameNum<38+1:
            result = [348, 100]
            break;
        case frameNum<42+1:
            result = [369, 100]
            break;
        case frameNum<43+1:
            result = [390, 100]
            break;
        case frameNum<50+1:
            result = [408, 100]
            break;
    }
    return result
}

const totalFrames = 51
const width = 498;
const height = 278;
// const avatarPath = "https://images-ext-1.discordapp.net/external/VvYGBMGAOxHGqy1QFeJm3u8Nta655M0vsYWDyYGdL8Y/%3Fsize%3D512/https/cdn.discordapp.com/avatars/488132273518936084/671b52cdb5b28cacfa1061899117b77e.webp?format=webp"

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
}
async function dissectGif(){
    const extractedFrames = await gifFrames({
        url: path.join(process.cwd(), 'media/execution_dr1_optimized.gif'),
        frames: 'all',
        outputType: 'png',
        cumulative: true,
    })
    return extractedFrames    
}
async function fullProcess({avatarPath, username}){
    console.log(avatarPath, username)
    console.time()
    const extractedFrames = await dissectGif()
    const fontPath2 = path.join(process.cwd(), "media/pixel-danganronpa.otf")
    GlobalFonts.registerFromPath(fontPath2, "dang")
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    const encoder = new GIFEncoder(width, height, 'neuquant', true)
    // const writeStream = createWriteStream('./output_1_.gif')
    // encoder.createReadStream().pipe(writeStream)

    const gifChunks = [];
    const encoderStream = encoder.createReadStream()

    encoderStream.on("data", (chunk)=> gifChunks.push(chunk))

    encoder.start()
    encoder.setRepeat(0)
    encoder.setDelay(100)
    encoder.setQuality(10)

    const avatar = await loadImage(avatarPath)

    const frameBuffers = await Promise.all(extractedFrames.map(frame=>streamToBuffer(frame.getImage())))
    // console.log(frameBuffers)
    for (let currentFrameIndex = 0; currentFrameIndex < 51; currentFrameIndex++){

        const img = await loadImage(frameBuffers[currentFrameIndex])

        ctx.clearRect(0,0, width, height)
        const frameData = await buildStudio(ctx, img,avatar, currentFrameIndex, username)
        encoder.addFrame(frameData)
    }
    encoder.finish()
    const finalBuffer = Buffer.concat(gifChunks)
    console.timeEnd()
    return finalBuffer
}

async function buildStudio(ctx,bg,avatar, frameNum, username){
    const cordsArray = imgDir(frameNum)
    const xCord = cordsArray[0]
    const yCord = cordsArray[1]
    const size = 90

    
    ctx.drawImage(bg, 0,0, width,height)
    ctx.drawImage(avatar, xCord, yCord, size, size)

    ctx.font = "18px dang"
    ctx.fillStyle = "#fafbf9"
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'
    // const username = "CHIAKI NANAMI DESU"
    segmentToUse = ""
    if(username.length > 19){
        username = username.slice(0, 18) + ".."
    }
    if(frameNum > 2){
        const segments = username.length / 6 // frames 3-8
    
        const charsToUse = Math.round(segments * (frameNum-2))
        const currentSegment = username.slice(0,charsToUse).padEnd(username.length, " ")
        segmentToUse = currentSegment
    }

    ctx.fillText(segmentToUse.slice(0,20), 141, 222, 141)
    
    return ctx.getImageData(0,0, width, height).data
}

module.exports = fullProcess;