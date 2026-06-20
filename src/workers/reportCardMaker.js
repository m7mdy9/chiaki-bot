const { promises:fs, createWriteStream } = require("node:fs")
const path = require("node:path")
const { createCanvas, GlobalFonts, loadImage } = require("@napi-rs/canvas")
const mediaDir = path.join(process.cwd(), '/media')

const width = 480;
const height = 272;

const reportCardPath = path.join(mediaDir, 'reportCard.png')
const textFontPath = path.join(mediaDir, 'DaysOne-Regular.ttf')
const usernameFontPath = path.join(mediaDir, "SourceSans3-SemiBold.ttf")
GlobalFonts.registerFromPath(textFontPath, "DaysOne")
GlobalFonts.registerFromPath(usernameFontPath, "SS3")
let backgroundImage = null

const loadBackgroundImage = async (imagePath)=>{
    if(backgroundImage) return backgroundImage;

    backgroundImage = await loadImage(imagePath)
    return backgroundImage
}

async function createReportCard(avatarPath, username, profile){

    await loadBackgroundImage(reportCardPath)
    
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    const size = 114
    const xCord = 342
    const yCord = 95

    const avatar = await loadImage(avatarPath)

    ctx.drawImage(backgroundImage, 0,0, width,height)
    ctx.drawImage(avatar, xCord, yCord, size, size)

    function isName(){
        ctx.font = "27px DaysOne"
        ctx.fillStyle = "#fafbf9"
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 6;
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
    }
    function otherProps(){
        ctx.font = "13px SS3"
        ctx.fillStyle = "#fafbf9"
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
    }

    const nameCords = {x:12, y:100, get width(){
         return 260}, name:"name"}
    const birthdayCords = {x: 99, y: (2*14+124)-2, get width(){
         return 66}, name:"birthday"}
    const bloodCords = {x: 250, y: (2*14+124)-2, get width(){
         return 66}, name:"blood"}
    const likesCords = {x: 99, y: (2*14+146)-2, get width(){
         return 314 - this.x}, name:"likes"}
    const disikesCords = {x: 99, y: (2*14+168)-2, get width(){
         return 314 - this.x}, name:"dislikes"}
    const talentCords = {x: 99, y: (2*14+190)-2, get width(){
         return 314 - this.x}, name:"talent"}
    const notesCords = {x: 99, y: (2*14+211)-2, get width(){
         return 314 - this.x}, name:"notes"}
    
    profile["name"] = username

    const cords = [nameCords, birthdayCords, bloodCords, likesCords, disikesCords, talentCords, notesCords]

    cords.forEach(cord =>{
        const { name, x, y, width } = cord
        const optionsForText = [profile[name], x, y, width] 

        if(name === "name"){
            isName()
            ctx.strokeText(...optionsForText)
        } else {
            otherProps()
        }
        ctx.fillText(...optionsForText)
    })


    const bufferImage = await canvas.encode("png")

    return bufferImage
}

module.exports = { createReportCard }