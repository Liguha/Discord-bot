const { refresh } = require("./chat.js");

async function command_refresh()
{
    return await refresh();
}

module.exports.command_refresh = command_refresh;