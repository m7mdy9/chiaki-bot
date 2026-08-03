const { promises:fs, createWriteStream } = require("node:fs")
const path = require("node:path")
const { createCanvas, GlobalFonts, loadImage } = require("@napi-rs/canvas")


const backgroundImagePath = path.join(process.cwd(), "media/introCard/Dangan_IntroCard_Credits.png") 
const fontPathSS3 = path.join(process.cwd(), "./media/introCard/SourceSans3-BlackItalic.ttf")
const fontPathPlayFair = path.join(process.cwd(), "media/introCard/Playfair_144pt-Black.ttf")

let backgroundImage = null

const loadBackgroundImage = async (imagePath)=>{
    if(backgroundImage) return backgroundImage;
    
    backgroundImage = await loadImage(imagePath)
    return backgroundImage
}


GlobalFonts.registerFromPath(fontPathSS3, "SS3BoldItalic")
GlobalFonts.registerFromPath(fontPathPlayFair, "Playfair")

const width = 1024;
const height = 578;

async function createIntroCard(avatarURL, primaryText, secondaryText){
    backgroundImage = await loadBackgroundImage(backgroundImagePath)

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    const size = 291

    const avatarXCord = 34
    const avatarYCord = 210

    const avatar = await loadImage(avatarURL)

    ctx.drawImage(backgroundImage, 0,0, width,height)
    ctx.drawImage(avatar, avatarXCord, avatarYCord, size, size)

    const angleInDegrees = -15;
    const radians = (angleInDegrees * Math.PI) / 180;

    ctx.save()

    const primaryTextX = 707;
    const primaryTextY = 283;
    const primaryTextWidth = 660

    const secondaryTextX = 689;
    let secondaryTextY = 189;
    const secondaryTextWidth = 660

    const hangingLeters = ['g', 'j', 'p', 'q', 'y']
    function primaryTextOptions(){
        ctx.font = "90px SS3BoldItalic"
        ctx.fillStyle = "#460a48"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.translate(primaryTextX, primaryTextY);
        ctx.rotate(radians);
    }
    function secondaryTextOptions(){
        ctx.font = "50px Playfair"
        ctx.fillStyle = "#ffa9f6"
        ctx.textAlign = 'center'
        if(secondaryText.split("").some(letter => hangingLeters.includes(letter))){
            secondaryTextY = 184
        }
        ctx.textBaseline = 'alphabetic'
        ctx.translate(secondaryTextX, secondaryTextY)
        ctx.rotate(radians);
    }

    if(primaryText.length > 40){
        primaryText = `${primaryText.slice(0,37)}...`
    }
    if(secondaryText.length > 44){
        secondaryText = `${secondaryText.slice(0,39)}...`
    }

    primaryTextOptions()
    ctx.fillText(primaryText, 0, 0, primaryTextWidth)
    ctx.restore()

    secondaryTextOptions()
    ctx.fillText(secondaryText, 0, 0, secondaryTextWidth)
    ctx.restore()


    const bufferImage = await canvas.encode("png")

    return bufferImage;
}

module.exports = { createIntroCard }