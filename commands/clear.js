const { get_queue } = require("../scripts/player_queue.js");
const { command_remove } = require("./remove.js");

async function command_clear()
{
    var queue = get_queue();
    var n = String(queue.length);
    return await command_remove({args: ["1", n]});
}

module.exports.command_clear = command_clear;