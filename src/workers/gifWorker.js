const { promises:fs, createWriteStream } = require("node:fs")
const path = require("node:path")
const { createCanvas, GlobalFonts, loadImage } = require("@napi-rs/canvas")
const gifFrames = require('gif-frames');
const GIFEncoder = require("gif-encoder-2/src/GIFEncoder");

const mediaFolder = `media/executeGif`
const pixelDanganronpaFontPath = path.join(process.cwd(), `${mediaFolder}/pixel-danganronpa.otf`)
const executionGifPath = path.join(process.cwd(), `${mediaFolder}/execution_dr1_optimized.gif`)

/** 
 * @param {Number} frameIndex - The frame Index/Number
 * @returns \{xCord, yCord} depending on the frame index
*/
const getFrameInfo =(frameIndex)=>{
    let result = { xCord:0, yCord:0 }
    switch (true) {
        case frameIndex<24+1:
            result = { xCord:205, yCord: 90 }
            break;
        case frameIndex<27+1:
            result = { xCord:264, yCord: 100 }
            break;
        case frameIndex<30+1:
            result = { xCord:287, yCord: 100 }
            break;
        case frameIndex<32+1:
            result = { xCord:306, yCord: 100 }
            break;
        case frameIndex<35+1:
            result = { xCord:329, yCord: 100 }
            break;
        case frameIndex<38+1:
            result = { xCord:348, yCord: 100 }
            break;
        case frameIndex<42+1:
            result = { xCord:369, yCord: 100 }
            break;
        case frameIndex<43+1:
            result = { xCord:390, yCord: 100 }
            break;
        case frameIndex<50+1:
            result = { xCord:408, yCord: 100 }
            break;
    }
    return result
}

// Loading the Danganronpa Font that will be used in buildEditedImage()
GlobalFonts.registerFromPath(pixelDanganronpaFontPath, "pixelDangan")

const totalFrames = 51
const width = 498;
const height = 278;

// returns a Promise that turns the buffer into a stream 
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
}

let dissectedGifFrames = null;

/** 
 * Dissects the gif into frames
 * 1. If the gif was already dissected, it returns the dissected gif
 * 2. Otherwise, it calls gifFrames which turns the gif into images of each frame
 * 3. using .getImage() on each frame returns us a stream, so we turn them into a Buffer using streamToBuffer() function
 * 4. We load each frame into canvas using loadImage() and into a variable named cachedFrames
 * 5. We assign the empty dissectedGifFrames variable the cachedFrames and return it.
*/
async function dissectGif(iterativeLoop=false){
    if(dissectedGifFrames && !process.env.isKoyeb) return dissectedGifFrames;
    else {
        const extractedFrames = await gifFrames({
            url: executionGifPath,
            frames: 'all',
            outputType: 'png',
            cumulative: true,
        })

        let frameBuffers = []
        let cachedFrames = []
        if(iterativeLoop){
            for (const frame of extractedFrames){
                frameBuffers.push(await streamToBuffer(frame.getImage()))
            }
            for (const buffer of frameBuffers){
                cachedFrames.push(await loadImage(buffer))
            }
        } else {
            frameBuffers = await Promise.all(extractedFrames.map(frame=>streamToBuffer(frame.getImage())));
            cachedFrames = await Promise.all(frameBuffers.map(buffer => loadImage(buffer)));
        }


        dissectedGifFrames = cachedFrames

        return cachedFrames
    }
}

/**
 * Creates a new frame, with the background set as backgroundImage, avatar set as avatarImage and username is displayed and segmented.
 *
 *  - Functions steps:
 * 
 * 1. Clearing the ctx, and getting the frame info
 * 2. Drawing the backgroundImage and the avatarImage at their correct coordiantes
 * 3. Setting the font/text options for the written out username.
 * 4. If the username is longer than 19 characters, we slice it and add ".." at the end.
 * 5. If the frame index is more than 2, we write out the actual username
 * 6. When writing the username, depending on the current frame, we choose how many characters to display depending on the frameIndex
 * 7. Then we write the segmentToUse (the characters that will displayed)
 * 8. Finally, we return the ctx.
 * @param {import('@napi-rs/canvas').Image} avatarImage - Image that will be plastered on the sprite
 * @param {import('@napi-rs/canvas').Image} backgroundImage - Image that will cover the background.
 * @param {import('@napi-rs/canvas').CanvasRenderingContext2D} ctx - ctx of the canvas you have created (width and height must match that of the `backgroundImage`)
 * @param {Number} frameIndex - The index/number of the current frame. (starting from 0)
 * @param {String} username - Username of the user that will be animated/displayed inside the image.
 * @returns {import('@napi-rs/canvas').CanvasRenderingContext2D} Returns the `ctx` provided cleared and with the drawn elements 
 */
async function buildEditedImage(ctx, backgroundImage, avatarImage, frameIndex, username){

    ctx.clearRect(0, 0, width, height);

    const cordsArray = getFrameInfo(frameIndex)
    const { xCord, yCord } = cordsArray
    const size = 90 // the height/width used in drawing the avatarImage
    
    
    ctx.drawImage(backgroundImage, 0,0, width,height)
    ctx.drawImage(avatarImage, xCord, yCord, size, size)

    ctx.font = "18px pixelDangan"
    ctx.fillStyle = "#fafbf9"
    ctx.textAlign = 'right'
    ctx.textBaseline = 'alphabetic'

    segmentToUse = ""

    if(username.length > 19){
        username = username.slice(0, 18) + ".."
    }
    if(frameIndex > 2){
        const segments = username.length / 6 // frames 3-8
    
        const charsToUse = Math.round(segments * (frameIndex-2))
        const currentSegment = username.slice(0,charsToUse).padEnd(username.length, " ")
        segmentToUse = currentSegment
    }

    const textXAxis = 141
    const textYAxis = 222
    const textWidth = 141
    ctx.fillText(segmentToUse.slice(0,20), textXAxis, textYAxis, textWidth)
    
    return ctx
}

/**
 * The main function of the gifWorker
 * 1. It extracts the gif via dissectGif()
 * 2. We set the encoder via GIFEncoder
 * 3. We make an empty gifChunks array and we create a readStream, and for every time it's called we push its buffer into gifChunks array
 * 4. We start the encoder and set its options
 * 5. Then we load the game into canvas and we create a new canvas and ctx
 * 6. We start a for-loop for each frame, where it's edited and built by buildEditedImage() then we add it into encoder
 * 7. Once we are done we call encoder.finish()
 * 8. We use Buffer.concat() to turn the gifChunks Array into a full buffer and then we return that full buffer
 * @returns {Uint8Array} - The Uint8Array Buffer of the newly built gif from the parameters given.
*/
async function fullProcess({avatarURL, username}){

    const extractedBackgroundImages = await dissectGif(process.env?.isKoyeb)
    
    const encoder = new GIFEncoder(width, height, 'octree', true)
    
    const gifChunks = [];
    const encoderStream = encoder.createReadStream()
    encoderStream.on("data", (chunk)=> gifChunks.push(chunk))
    
    const streamPromise = streamToBuffer(encoderStream);

    // Encoder start & options
    encoder.start()
    encoder.setRepeat(0)
    encoder.setDelay(100)
    encoder.setQuality(10)
    
    const avatarImage = await loadImage(avatarURL)
    
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    for (let i = 0; i < extractedBackgroundImages.length; i++){
        const frame = await buildEditedImage(
            ctx,
            extractedBackgroundImages[i],
            avatarImage,
            i,
            username
        );

        encoder.addFrame((frame))
    }

    encoder.finish()

    const finalBuffer = await streamPromise
    
    return finalBuffer
}


module.exports = fullProcess;