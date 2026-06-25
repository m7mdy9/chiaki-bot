# Contributing to Chiaki Bot
First of all, thank you for contributing or attempting to contribute to Chiaki Bot, all pull requests are welcome as long as they are reasonable and follow the guidelines within this file.

In order to avoid any stability issues and to make sure the bot is always up with almost no errors, please follow the **Branching Rules.**

## Branching Rules (!):
* **`main`**:  Production Branch. Do **NOT** submit any Pull Requests directly to `main`, if you do so I will have to decline them.
* **`testing`**: The testing/development Branch. **All Pull Requests are to be submitted to `testing` branch**

## Local Setup
Make sure you have [node.js](https://nodejs.org/) downloaded before going further.

1. **Fork & Clone**: Fork this Repo to your own github account and make sure to clone it.
2. **Installing packages**: Run `npm install` in the Repo directory, in order to downloaded all needed packages.
3. **Setup your `.env` and `.gitignore` file!**
    * Create your `.env` file in the root directory.
    * Add the following and replace the values with actual values from your testing environment.
    ```env
    # Main Tokens and DB URI
    TOKEN=discord_bot_token_here_this_token_will_be_used_if_branchName_is_main
    mongo=mongodb_cluster_login_here

    # Owner Id and Client ID
    ownerId=owner_id_goes_here
    clientId=client_id_used_if_branchName_is_main

    # Testing Token & Client ID if the branch is not `main` (OPTIONAL, IF NOT SET THE BOT WILL JUST USE THE MAIN TOKEN AND CLIENTID)
    TESTING_TOKEN=testing_bot_token
    TESTING_clientId=testing_bot_clientId
    
    # Bot Invite Link.
    INVITE=bot_invite_link


    secretUser=id_used_for_specific_odds_in_howdangareyou_(pretty much rigged odds against a friend of mine)

    # Dog Fact API & API Key
    dogAPIKey=api_used_from_thedogapi.com_for_dog_pictures
    dogFactAPIKey=api_used_for_dog_facts_link_for_api:https://rapidapi.com/maketest-1YGgU5ZOtA/api/random-dog-facts/pricing


    # categories for reports
    bugReportCategoryId=categoryId_where_bugReports_are_made
    bugReportArchiveCategoryId=categoryId_of_bugReports_archives

    userReportCategoryId=categoryId_where_userReports_are_made
    userReportArchiveCategoryId=categoryId_where_userReports_are_archived

    # Some hex colors used inside the bot.
    pink="#ffdcfc"
    red="#ff8d8d"
    green='#97ff94'
    dark_red="#a80000"
    
    # colors for terminal
    RED='\x1b[31m'
    YELLOW='\x1b[33m'
    RESET='\x1b[0m'
    GREEN='\x1b[32m'
    DARK_GREY='\x1b[1;30m'

    # IDs of emojis! (you can set emoji ids inside your bot via dev portal)
    DARK_RED_SQUARE=replace_with_emoji_id_of_a_dark_red_square
    BLACK_SQUARE=replace_with_emoji_id_of_a_black/dark_grey_square
    ```
    * Create your .gitignore and make sure the following (DO NOT COMMIT YOUR `.env` OR `node_modules/`)
    ```.gitignore
    .env
    node_modules/
    ```
4. **Create a Feature Branch!** Branch off of `testing` for the new things you are contributing!
    ```bash
    git checkout testing
    git checkout -b feature/feature_name_goes_here
    ```

## Running the Bot
You can run the bot either by `npm start`, `node .` or `node index.js`.
* Running your bot via `npm start` prevents env from echoing into the console if you would like a clean output.

## Command Example
- For Subcommands, include them in a folder inside their category, and that will automatically apply as a subcommand
    * For example if the we have `misc/dice/roll.js` the command in Discord will show up as `/dice roll`.
- For subcommands, if you want to set a required permission you have to put in the subcommand folder the name of the permission (e.g. `ManageRoles` ) as an empty file, and it's preceeded by a !, so the permission file would be `misc/dice/!ManageRoles` (CASE SENSITIVE), You do not need to include anything inside the file, and it must have no extension.
```js
const { getOptionNum, embed_builder, hiddenFlag, getPermissionNum, embed_builder, embed_info } = require("/path/to/utils/utils.js")

module.exports = {
    name:"command_name",
    description:"command description",
    // Options for your command
    setup: async function(){ // OPTIONAL
        /* Your setup function, this code runs at the bot's intilization.
        Usually code that goes here is code that includes promises that must be called and fulfilled when the bot first starts
        You mostly will put variables before module.exports and you will change them inside here and you would use them in the main execute() for your command */
    },
    options: [
        {
            name:'option_name', // REQUIRED, MUST BE LOWERCASE.
            description: 'option_description', // required
            type: getOptionNum("INTEGER"), // required
            /* OPTIONS:
            "SUB_COMMAND",
            "SUB_COMMAND_GROUP",
            "STRING",
            "INTEGER",
            "BOOLEAN",
            "USER",
            "CHANNEL",
            "ROLE",
            "MENTIONABLE",
            "NUMBER",
            "ATTACHMENT"*/
            required: false, // false/true
            // You could also add choices: however it must be in the following format
            //  [{name:choice_name, value:choice_value},{name:choice_name2, value:choice_value2}] and so on
        },
        //You can add more options
    ],
    permissions:"ManageRoles", // ONLY FOR NON-SUBCOMMANDS, CASE SENSITIVE. and is OPTIONAL!
    hidden: true, //Makes the command Ephemeral (only the user who ran it can see it), false by default
    // Defining interaction for correct autocomplete provided by your editor
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction){
        /*
        Your code goes here, make sure to use interaction.editReply() instead of interaction.reply(),
        as commands are automatically deferred and you must edit them to insert anything,
        and whether the command is ephemeral (hidden) is also decided there,
        so if you want the command to be hidden, make sure to use hidden:true, mentioned earlier
        */
       return interaction.editReply({content:"I have made a cool command for Chiaki-Bot!"})
    }
}
```