const { getOptionNum, embed_builder, hiddenFlag } = require("../../utils/utils.js")
const { buttonBuilder } = require("../../utils/builders.js")

module.exports = {
    name: "rps",
    description: "Play Rock Paper Scissors with someone! (or with Chiaki Nanami!)",
    options: [
        {
            name: "opponent",
            description: "Choose your opponent. (if left empty you will play against Chiaki Nanami)",
            type: getOptionNum("USER"),
            required: false,
        }
    ],
    hidden: true,
    /** @param {import("discord.js").ChatInputCommandInteraction} interaction */
    async execute(interaction){
        const intUser = interaction.user
        const targetUser = interaction.options.getUser("opponent") || interaction.client.user
        const isBot = targetUser.bot
        let isMe = false;
        let oppChoice,userChoice;
        let alreadyTimed = false;
        const rpsList = ["rock", "paper", "scissors"]
        if(targetUser.id == interaction.client.user.id){
            isMe = true;
        }
        if(isBot && !isMe){
            return interaction.editReply("You can not choose to play against a bot other than me.")
        }
        if(isMe){
            oppChoice = rpsList[Math.floor(Math.random()*rpsList.length)]
        }
        function rps(choice1,choice2){
            const [choice1Index,choice2Index] = [rpsList.indexOf(choice1),rpsList.indexOf(choice2)]
            let output;
            if(choice1Index === choice2Index){
                output = 0
            } else if( [1,-2].includes((choice1Index - choice2Index))){
                output = 1
            } else if( [1,-2].includes(choice2Index - choice1Index)){
                output = 2
            }
            // 0 means Tie, 1 means Player 1 Wins, 2 means Player 2 wins 
            return output
        }

        const friendlyButtons = new buttonBuilder(interaction)
            .addButton("f_rock",null,"Primary",null,"🪨")
            .addButton("f_paper",null,"Primary",null,"📄")
            .addButton("f_scissors",null,"Primary",null,"✂️")
        const enemyButtons = new buttonBuilder(interaction)
            .addButton("e_rock",null,"Primary",null,"🪨")
            .addButton("e_paper",null,"Primary",null,"📄")
            .addButton("e_scissors",null,"Primary",null,"✂️")
        const embed = embed_builder("Rock Paper Scissors",`<@!${intUser.id}> vs <@!${targetUser.id}>\n\nMake your choice.`)
        const friendlyInt = await interaction.editReply({content:`<@!${intUser.id}>`,embeds:[embed], components:[friendlyButtons.getRow()], withReponse: true})
        let enemyInt;
        if(!isMe){
            enemyInt = await interaction.followUp({content:`<@!${targetUser.id}>`,embeds:[embed], components:[enemyButtons.getRow()], withReponse: true})
        }
        const timeout = async (collected,reason)=>{
            if(reason != "time" && reason != "idle"){
                return;
            }
            if(alreadyTimed) return;
            await interaction.deleteReply()
            try{
                if(enemyInt){await interaction.webhook.deleteMessage(enemyInt.id)}
            } catch(err){console.warn("Message already deleted.")}
            interaction.followUp({content:"Ran out of time."})
            alreadyTimed = true;
        }
        friendlyButtons.startListener(friendlyInt, undefined, async (int)=>{
            if(int.user.id != intUser.id){
                return int.reply({content:"You are not the player in this embed.", flags:[hiddenFlag]})
            }
            userChoice = int.customId.slice(2)
            if(!oppChoice){
                await interaction.editReply({content:"Waiting for the other player...", embeds:[], components:[]})
            } else {
                await interaction.editReply({content:"Processing...", embeds:[], components:[]})
                return endGame()
            }
        }, timeout)
        if(enemyInt){
            enemyButtons.startListener(enemyInt, undefined, async (int)=>{
                if(int.user.id != targetUser.id){
                    return int.reply({content:"You are not the player in this embed.", flags:[hiddenFlag]})
                }
                oppChoice = int.customId.slice(2)
                if(!userChoice){
                    await interaction.webhook.editMessage(enemyInt.id, {content:"Waiting for the other player...", embeds:[], components:[]})
                } else {
                    await interaction.webhook.editMessage(enemyInt.id, {content:"Processing...", embeds:[], components:[]})
                }
                return endGame()
            },timeout)
        }

        async function endGame(){
            if(!oppChoice || !userChoice) return;
            let endOutput = rps(userChoice, oppChoice)
            try{
                await interaction.deleteReply()
                if(enemyInt){await interaction.webhook.deleteMessage(enemyInt.id)}
            } catch(err){console.warn("Message already deleted.")}
            const formattedUserChoice = userChoice.charAt(0).toUpperCase() + userChoice.slice(1)
            const formattedOppChoice = oppChoice.charAt(0).toUpperCase() + oppChoice.slice(1)
            switch (endOutput){
                case 0:
                    endOutput = `🥈 **Draw!** Nobody wins :(`
                    break;
                case 1:
                    endOutput = `🏆️ **<@!${intUser.id}> wins!**`
                    break;
                case 2:
                    endOutput = `🏆️ **<@!${intUser.id}> wins!**`
                    break;
            }
            const lastEmbed = embed_builder(
                "RPS Result",
                `<@!${intUser.id}> vs <@!${targetUser.id}>`
                +`\n**${formattedUserChoice}** vs **${formattedOppChoice}**`
                +`\n${endOutput}`
            )
            alreadyTimed = true;
            return interaction.followUp({content:`<@!${intUser.id}><@!${targetUser.id}>`,embeds:[lastEmbed]})
        }
    }
}