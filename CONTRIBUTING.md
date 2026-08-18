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
    # Main Bot Credentials
    BOT_TOKEN=main_bot_token
    MONGODB_KEY=mongodb_uri
    CLIENT_ID=client_id
    DBL_TOKEN=discord_bot_list_token
    
    #Error Handling Webhook
    MAIN_ERR_WEBHOOK=webhook_link_for_errors
    TESTING_GUILD=guild_id_for_testing

    # Misc IDs
    SupportServerId=support_guild_id_OPTIONAL_UNUSED
    OWNER_ID=966205214308847626

    # for a little rigged odds in /howdangareyou commands (pls dont gamble with these commands)
    RIGGED_USER_ID=user_id

    # Dog API Key (thedogapi.com) and Dog Facts API Key (https://rapidapi.com/maketest-1YGgU5ZOtA/api/random-dog-facts/pricing)
    DOG_API_KEY=insert_dog_api_key
    DOGFACT_API_KEY=insert_dog_fact_api_key

    # categories for reports
    BUG_REPORT_CATEGORY_ID=category_id
    BUG_REPORT_ARCHIVE_CATEGORY_ID=category_id

    USER_REPORT_CATEGORY_ID=category_id
    USER_REPORT_ARCHIVE_CATEGORY_ID=category_id

    # Testing Bot Credentials (LEAVE EMPTY IF YOU DO NOT HAVE A TESTING BOT, IT WILL FALLBACK TO THE PRIMARY ONES)
    TESTING_TOKEN=testing_bot_token
    TESTING_CLIENT_ID=testing_bot_client_id
    MONGODB_TESTING_KEY=testing_mongodb_uri

    # Emojis IDs for Production (Main Branch)
    DARK_RED_SQUARE=emoji_id
    BLACK_SQUARE=emoji_id

    # Emojis IDs for Testing Branch
    DARK_RED_SQUARE_TESTING=emoji_id
    BLACK_SQUARE_TESTING=emoji_id

    # slur blacklist words, include words in the following format:
    WORD_BLACKLIST=badWord1,badWord2,badWord3,badWord4...and so on.
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
You can run the bot either by `npm start` or `node src/index.js`.

## Command Example
- For Subcommands, include them in a folder inside their category, and that will automatically apply as a subcommand
    * For example if the we have `misc/dice/roll.js` the command in Discord will show up as `/dice roll`.
- For subcommands, if you want to set a required permission you have to put in the subcommand folder the name of the permission (e.g. `ManageRoles` ) as an empty file, and it's preceeded by a !, so the permission file would be `misc/dice/!ManageRoles` (CASE SENSITIVE), You do not need to include anything inside the file, and it must have no extension.
```js
const { getOptionNum, embed_builder, hiddenFlag, getPermissionNum, embed_builder, embed_info } = require("/path/to/utils/utils.js")
// there exists alot of helpers and utility stuff in utils.js so make sure to give it a look!

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
            description: 'option_description', // requiredisServerOnly: true,
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
    hidden: true, // Makes the command Ephemeral (only the user who ran it can see it), false by default
    isServerOnly: true, // Makes the command ONLY work if the bot is in the server its running in, and server only of course

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