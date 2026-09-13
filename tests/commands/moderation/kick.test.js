const kickCommand = require("../../../src/commands/moderation/kick.js");
const { createModerationInt, createMockTargetMember } = require("../../testUtils.js");

describe("Kick Command", ()=>{
    let interaction;
    const defaultMockTargetMember = createMockTargetMember()

    beforeEach(()=>{
        interaction = createModerationInt(defaultMockTargetMember)
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
            title: "user not in the server",
            setup: (i) => i.options.getMember.mockReturnValue(null),
            expected: "user is not in the server"
        },
        {
            title: "kicking themselves",
            setup: (i) => i.options.getMember.mockReturnValue({...defaultMockTargetMember, id: "executor_id"}),
            expected: "not kick yourself",
        },
        {
            title: "kicking someone with the same role",
            setup: (i) => i.options.getMember.mockReturnValue({...defaultMockTargetMember, roles: { highest:{rawPosition: 10} }}),
            expected: "who has a role higher or equal to yours",
        },
        {
            title: "kicking someone with a higher role",
            setup: (i) => i.options.getMember.mockReturnValue({...defaultMockTargetMember, roles: { highest:{rawPosition: 20} }}),
            expected: "who has a role higher or equal to yours",
        },
        {
            title: "kicking the guild owner",
            setup: (i) => i.guild.ownerId = "target_id",
            expected: "kick the owner of this server",
        },
        {
            title: "kicking the bot itself",
            setup: (i) => i.client.user.id = "target_id",
            expected: "I can't do it",
        },
        {
            title: "target is marked as unkickable",
            setup: (i) => i.options.getMember.mockReturnValue({...defaultMockTargetMember, kickable: false}),
            expected: "I can not kick this user",
        },
    ]
    test.each(validationCases)(`Returns if $title`, async ({ setup, expected }) =>{
        setup(interaction);

        await kickCommand.execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining(expected)
        })
    })

    test("Succeeds if owner kicks someone with a higher role", async ()=>{
        interaction.options.getMember.mockReturnValue({
            ...defaultMockTargetMember, roles: { highest: {rawPosition: 20} }
        });
        interaction.guild.ownerId = "executor_id";

        await kickCommand.execute(interaction);

        expect(defaultMockTargetMember.kick).toHaveBeenCalled()
    })

    test("Succeeds if all checks pass normally", async ()=>{
        await kickCommand.execute(interaction)

        expect(defaultMockTargetMember.kick).toHaveBeenCalled()
    })
})