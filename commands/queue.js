const { get_queue } = require("../scripts/player_queue.js");

async function command_queue()
{
    var msg = ["Список запросов:"];
    var queue = get_queue();
    var k = 0;
    for (var i = 0; i < queue.length; i++)
    {
        var str = queue[i].prompt + " => <" + queue[i].output + ">";
        if (msg[k].length > 1800)
        {
            k++;
            msg.push("");
        }
        msg[k] += "\n" + (i + 1) + ". " + str;
    }
    return msg;
}

module.exports.command_queue = command_queue;