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
        
        const resultObj = { tie: 0, player1Win: 1, player2Win: 2}
        const rpsList = ["rock", "paper", "scissors"]
        const rpsRules = {
            "rock": {
                lose: "paper",
            },
            "paper": {
                lose: "scissors",
            },
            "scissors": {
                lose: "rock",
            },
        }

        let isMe = false;
        let oppChoice,userChoice;
        let alreadyTimed = false;
        let enemyInt; //unassigned if playing against bot
        
        if(targetUser.id == interaction.client.user.id){
            isMe = true;
        }
        if(isBot && !isMe){
            return interaction.editReply("You can not choose to play against a bot other than me!")
        }
        if(isMe){
            oppChoice = rpsList[Math.floor(Math.random()*rpsList.length)]
        }
        
        // 0 = "rock", 1 = "paper", 2 = "scissors"
        // 0-1 = -1 (lose), 1-2 = -1 (lose), 2-0 = 2 (lose)
        // 0-2 = -2 (win), 1-0 = 1 (win), 2-1 = 1 (win)

        function rpsResults(player1Choice, player2Choice){
            const player1ChoiceObj = rpsRules[player1Choice];
            const player2ChoiceObj = rpsRules[player2Choice];
            let output;
            
            if(player1Choice === player2Choice){
                output = resultObj.tie;
            } else if(player1Choice === player2ChoiceObj.lose){
                output = resultObj.player1Win;
            } else if(player2Choice === player1ChoiceObj.lose){
                output = resultObj.player2Win;
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
        
        if(!isMe){
            enemyInt = await interaction.followUp({content:`<@!${targetUser.id}>`,embeds:[embed], components:[enemyButtons.getRow()], withReponse: true})
        }

        // for reference, webhook here is used to access webhookClient to edit the followUp marked as enemyInt

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
            }, timeout, false)
        }
        
        async function endGame() {
            if (!oppChoice || !userChoice) return;
            let rpsEndResult = rpsResults(userChoice, oppChoice)
            let formattedResult;

            try {
                await interaction.deleteReply()
                if (enemyInt) { await interaction.webhook.deleteMessage(enemyInt.id) }
            } catch (err) { console.warn("Message already deleted.") }

            const formattedUserChoice = userChoice.charAt(0).toUpperCase() + userChoice.slice(1)
            const formattedOppChoice = oppChoice.charAt(0).toUpperCase() + oppChoice.slice(1)

            switch (rpsEndResult) {
                case 0:
                    formattedResult = `🥈 **Draw!** Nobody wins :(`
                    break;
                case 1:
                    formattedResult = `🏆️ **<@!${intUser.id}> wins!**`
                    break;
                case 2:
                    formattedResult = `🏆️ **<@!${targetUser.id}> wins!**`
                    break;
            }

            const lastEmbed = embed_builder(
                "RPS Result",
                `<@!${intUser.id}> vs <@!${targetUser.id}>`
                + `\n**${formattedUserChoice}** vs **${formattedOppChoice}**`
                + `\n${formattedResult}`
            )
            alreadyTimed = true;
            return interaction.followUp({ content: `<@!${intUser.id}><@!${targetUser.id}>`, embeds: [lastEmbed] })
        }

        async function timeout(collected,reason){
            if(userChoice && oppChoice && !alreadyTimed && ["time","idle"].includes(reason)){
                return endGame();
            }
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
    }
}