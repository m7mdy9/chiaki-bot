const unbanCommand = require("../../../src/commands/moderation/unban.js");
const { createModerationInt } = require("../../testUtils.js");

describe("Unban Command", ()=>{
    let interaction;

    beforeEach(()=>{
        interaction = createModerationInt()
        interaction.guild.bans.fetch = jest.fn().mockResolvedValue(true)
    })

    const validationCases = [
        {
            title: "bot has no perms",
            setup: (i) => i.appPermissions.has.mockReturnValue(false),
            expected: "I do not possess permissions to",
        },
        {
            title: "user has no perms",
            setup: (i) => i.member.permissions.has.mockReturnValue(false),
            expected: "You do not have permissions"
        },
        {
            title: "target is not banned",
            setup: (i) => i.guild.bans.fetch = jest.fn().mockResolvedValue(null),
            expected: "This user is not banned",
        },
    ]
    test.each(validationCases)(`Returns if $title`, async ({ setup, expected }) =>{
        setup(interaction);

        await unbanCommand.execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining(expected)
        })
    })

    test("Succeeds if all checks pass normally", async ()=>{
        await unbanCommand.execute(interaction)
    
        expect(interaction.guild.bans.remove).toHaveBeenCalled()
    })
})