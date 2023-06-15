const { command_play, command_queue, command_skip, command_remove, command_clear } = require("../commands/player_module.js");
const { command_prefix } = require("../commands/prefix.js");
const { command_vprefix } = require("../commands/vprefix.js");
const { command_join } = require("../commands/join.js");
const { command_members } = require("../commands/members.js");
const { command_equal } = require('../commands/equal.js');
const { command_playlist } = require('../commands/playlist.js');
const { command_help } = require('../commands/help.js');
const { command_chat, command_draw, command_refresh } = require("../commands/openai_module.js");
const { command_picture } = require("../commands/picture.js");
const { command_anime } = require("../commands/anime.js");

async function perform_command(client, message, command, args)
{
    var promise = null;
    var valid = true;
    switch (command)
    {
        case "sum":
            var res = Number(args.shift()) + Number(args.shift());
            message.channel.send(res.toString());
            break;

        case "prefix":
            promise = command_prefix(args);
            break;

        case "vprefix":
            promise = command_vprefix(args);
            break;

        case "join":
            promise = command_join(message);
            break;

        case "members":
            promise = command_members(message);
            break;

        case "play":
            promise = command_play(message, args);
            break;

        case "skip":
            promise = command_skip();
            break;

        case "remove":
            promise = command_remove(args);
            break;

        case "clear":
            promise = command_clear();
            break;

        case "queue":
            promise = command_queue();
            break;

        case "equal":
            promise = command_equal(args);
            break;
        
        case "playlist":
            promise = command_playlist(client, message, args);
            break;

        case "help":
            promise = command_help(args);
            break;

        case "chat":
            promise = command_chat(args);
            break;

        case "draw":
            promise = command_draw(message, args);
            break;

        case "refresh":
            promise = command_refresh();
            break;

        case "picture":
            promise = command_picture(args);
            break;
        
        case "anime":
            promise = command_anime(args);
            break;
        
        default:
            valid = false;
            break;
    }
    if (!valid)
        return;

    var waiting = true;
    await message.channel.sendTyping();
    var interval = setInterval(() =>
    {
        if (waiting)
            message.channel.sendTyping();
        else
            clearInterval(interval);
    }, 1000)
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