process.env.currentBranch = "main"
const { loadCommands } = require("../../src/handlers/commandHandler.js");
const { getPermissionNum } = require("../../src/utils/utils.js");
const { createClient } = require("../testUtils");
const path = require("path")

describe("commandHandler test", ()=>{
    let client;
    let commands;

    beforeAll(async ()=>{
        client = createClient()
        commands = await loadCommands(path.join(__dirname, "mockCommands"), client)
    })
    
    test("Skips command with no execute function or any data", ()=>{
        const nodataCommand = commands.find(el => el.name == "nodata")
        const noexecuteCmd = commands.find(el => el.name == "noexecute")

        expect(nodataCommand).toBeFalsy();
        expect(noexecuteCmd).toBeFalsy();
    })

    test("Skips command with no category", ()=>{
        const noCategoryCommand = commands.find(el => el.name == "nocategory")

        expect(noCategoryCommand).toBeFalsy();
    })

    test("Normal Commands have proper properties", ()=>{
        const normalCommand = commands.find(el => el.name == "normalcmd")
        const { name, description } = require("./mockCommands/misc/normalcmd.js")

        expect(normalCommand).toMatchObject({
            name,
            description,
            options: [],
            default_member_permissions: null,
            dm_permission: true,
            contexts: [0, 1],
            integration_types: [0],
        })
    })

    test("Commands with no name and description are corrected", ()=>{
        const nonamedesCommand = commands.find(el => el.name == "nonamedesc")

        expect(nonamedesCommand).toMatchObject({
            name: "nonamedesc",
            description: "No description provided"
        })
    })

    test("Owner commands are skipped from main branch", ()=>{
        const ownercmd = commands.find(el => el.name == "ownercmd")
        const subOwnercmd = commands.find(el => el.name == "subowner")?.options?.length

        expect(ownercmd || subOwnercmd).toBeFalsy();
    })

    test("Permission are handled accordingly in subcommands", ()=>{
        const subcmd = commands.find(el => el.name == "sub");

        expect(subcmd.default_member_permissions).toBe(getPermissionNum("Administrator"));
        expect(subcmd.dm_permission).toBeFalsy();
        expect(subcmd.contexts.includes(1)).toBeFalsy();
    })

    test("Permissions are handled accordingly in normal commands", ()=>{
        const permissioncmd = commands.find(el => el.name == "permissioncmd");

        expect(permissioncmd.default_member_permissions).toBe(getPermissionNum("Administrator"));
        expect(permissioncmd.dm_permission).toBeFalsy();
        expect(permissioncmd.contexts.includes(1)).toBeFalsy();
    })

    test("Read Only commands are skipped", ()=>{
        const readonlycmd = commands.find(el => el.name == "readonlycmd")

        expect(readonlycmd).toBeFalsy();
    })

    test("Server Only commands are handled correctly", ()=>{
        const serveronlycmd = commands.find(el => el.name == "isserveronly")

        expect(serveronlycmd.dm_permission).toBeFalsy();
        expect(serveronlycmd.contexts.includes(1)).toBeFalsy();
    })

    test("Installed commands (manual or automatic) are handled correctly", ()=>{
        const funcmd = commands.find(el => el.name == "funcmd")
        const subfuncmd = commands.find(el => el.name == "subfun")
        const isinstalledcmd = commands.find(el => el.name == "isinstalled")

        expect(funcmd.integration_types.includes(1)).toBeTruthy()
        expect(funcmd.contexts.includes(2)).toBeTruthy()
        expect(subfuncmd.integration_types.includes(1)).toBeTruthy()
        expect(subfuncmd.contexts.includes(2)).toBeTruthy()
        expect(isinstalledcmd.integration_types.includes(1)).toBeTruthy()
        expect(isinstalledcmd.contexts.includes(2)).toBeTruthy()
    })
})
