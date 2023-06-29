const fs = require("fs");
const path = require("path")
const route = path.join(__dirname, "..", "commands/");

var functions = {};

var files = fs.readdirSync(route);
for (var i = 0; i < files.length; i++)
{
    var command = files[i].split(".")[0];
    var mod = require(route + files[i]);
    functions[command] = mod["command_" + command];
}

async function perform_command(client, message, command, args)
{
    if (!(command in functions))
        return;

    var info =
    {
        client: client,
        message: message,
        args: args
    }
    var promise = functions[command](info);

    var waiting = true;
    await message.channel.sendTyping();
    var interval = setInterval(() =>
    {
        if (waiting)
            message.channel.sendTyping();
        else
            clearInterval(interval);
    }, 1000);
    var msg = await promise;
    waiting = false;

    for (var i = 0; i < msg.length; i++)
    {
        if (msg[i] == null)
        {
            await message.channel.send("Выполнено");
            break;
        }
        await message.channel.send(msg[i]);
    }
}

module.exports.perform_command = perform_command;