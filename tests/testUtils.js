const { Collection } = require("discord.js");
const { mockDeep } = require("jest-mock-extended");

const createMockTargetMember = () => {
    return {
        id: "target_id",
        kickable: true,
        bannable: true,
        manageable: true,
        displayName: "targetMember#0000",
        roles: { highest: { rawPosition: 1 } },
        joinedTimestamp: Date.now() - (60 * 60 * 1000),

        kick: jest.fn().mockResolvedValue(true),
        ban: jest.fn().mockResolvedValue(true),
        timeout: jest.fn().mockResolvedValue(true),
        send: jest.fn().mockResolvedValue(true),

        user: {
            id: "target_id",
            username: "targetMember",
            tag: "targetMember#0000",
            bot: false,
            displayAvatarURL: jest.fn().mockReturnValue("https://cdn.discordapp.com/embed/avatars/0.png"),
            ban: jest.fn().mockResolvedValue(true),
            send: jest.fn().mockResolvedValue(true),
        }
    }
}

const createMockClient = () => {
    return {
        commands: new Collection(),
        cooldowns: new Collection(),
        user: {
            id: "bot_id",
            username: "bot_name",
            displayName: "bot_displayName",
        },
        guilds: {
            cache: new Collection(),
        },
        channels: {
            cache: new Collection(),
        },
        users: {
            cache: new Collection(),
        }
    }
}

function createModerationInt(mockTargetMember){
    if(!mockTargetMember) mockTargetMember = createMockTargetMember();
    const interaction = mockDeep();

    interaction.client = createMockClient();
    interaction.user.id = "executor_id"
    interaction.member.id = "executor_id"
    interaction.client.user.id = "bot_id"
    interaction.guild.ownerId = "owner_id";
    
    interaction.appPermissions.has.mockReturnValue(true)
    interaction.member.permissions.has.mockReturnValue(true) // executor perms
    interaction.member.roles.highest.rawPosition = 10; // executor pos
    

    interaction.options.getMember.mockReturnValue(mockTargetMember)
    interaction.options.getUser.mockReturnValue(mockTargetMember.user)

    interaction.options.get.mockReturnValue({
        id: mockTargetMember.id,
        user: mockTargetMember.user,
        member: mockTargetMember,
    })
    
    interaction.guild.members.fetch = jest.fn().mockResolvedValue(mockTargetMember)
    interaction.guild.bans.fetch = jest.fn().mockResolvedValue(null)
    interaction.guild.members.ban = jest.fn().mockResolvedValue(true)
    interaction.guild.bans.remove = jest.fn().mockResolvedValue(true)

    return interaction;
}
function createClient(mockClient) {
    if(!mockClient) mockClient = createMockClient();
    const client = mockDeep();
    Object.assign(client, mockClient)
    return client;
}

module.exports = { createModerationInt, createClient, createMockTargetMember, createMockClient }