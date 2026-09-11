const banCommand = require("../../../src/commands/moderation/ban.js");
const { createModerationInt, defaultMockTargetMember } = require("../../testUtils.js");

describe("Ban Command", ()=>{
    let interaction;

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
            title: "banning themselves",
            setup: (i) => i.options.get.mockReturnValue({
                member: {...defaultMockTargetMember, id: "executor_id"},
                user:{...defaultMockTargetMember.user, id: "executor_id"}
            }),
            expected: "not ban yourself",
        },
        {
            title: "banning the guild owner",
            setup: (i) => i.guild.ownerId = "target_id",
            expected: "ban the owner",
        },
        {
            title: "banning someone with the same role",
            setup: (i) => i.options.get.mockReturnValue({
                member: {...defaultMockTargetMember, roles: { highest:{rawPosition: 10} }},
                user: defaultMockTargetMember.user,
            }),
            expected: "higher role or equivelent role"
        },
        {
            title: "banning someone with a higher role",
            setup: (i) => i.options.get.mockReturnValue({
                member: {...defaultMockTargetMember, roles: { highest:{rawPosition: 20} }},
                user: defaultMockTargetMember.user,
            }),
            expected: "higher role or equivelent role",
        },
        {
            title: "banning the bot itself",
            setup: (i) => i.client.user.id = "target_id",
            expected: "I can't do it",
        },
        {
            title: "target is already banned",
            setup: (i) => interaction.guild.bans.fetch = jest.fn().mockResolvedValue(true),
            expected: "already banned",
        },
        {
            title: "target is marked as unbannable",
            setup: (i) => i.options.get.mockReturnValue({
                member: {...defaultMockTargetMember, bannable: false},
                user: defaultMockTargetMember.user,
            }),
            expected: "I can not ban this student",
        },
    ]
    test.each(validationCases)(`Returns if $title`, async ({ setup, expected }) =>{
        setup(interaction);

        await banCommand.execute(interaction);

        expect(interaction.editReply).toHaveBeenCalledWith({
            content: expect.stringContaining(expected)
        })
    })

    test("Succeeds if owner bans someone with a higher role", async ()=>{
        interaction.options.get.mockReturnValue({
            member: {...defaultMockTargetMember, roles: { highest: {rawPosition: 20} }},
            user: defaultMockTargetMember.user,
        });
        interaction.guild.ownerId = "executor_id";

        await banCommand.execute(interaction);

        expect(interaction.guild.members.ban).toHaveBeenCalled()
    })

    test("Succeeds if all checks pass normally", async ()=>{
        await banCommand.execute(interaction)

        expect(interaction.guild.members.ban).toHaveBeenCalled()
    })
})