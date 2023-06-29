const file = require("../json/playlists.json");
const errors = require("../json/error_reports.json");
const { rephrase } = require("./chat.js");
const { command_play } = require("../commands/play.js");

async function command_playlist({client, message, args})
{
    switch (args.shift())
    {
        case "list":
            var msg = "Список плейлистов:";
            for (var i = 0; i < file.size; i++)
            {
                var k = i + 1;
                msg += "\n" + k + ". " + file.body[i].name;
            }
            return [msg];

        case "info":
            var msg = "";
            var n = parseInt(args.shift()) - 1;
            if (n < 0 || n >= file.size || isNaN(n))
                msg += await rephrase(errors.playlist.invalid_number1);
            else
            {
                var user = await client.users.fetch(file.body[n].author);
                msg += "**Автор**: " + user.toString() + "\n";
                msg += "**Название**: " + file.body[n].name + "\n";
                msg += "**Композиции**: "
                for (var i = 0; i < file.body[n].size; i++)
                {
                    var k = i + 1;
                    msg += "\n      " + k + "\\. " + file.body[n].tracks[i];
                }
            }
            return [msg];

        case "create":
            var arg_name = args.shift();
            for (var i = 0; i < args.length; i++)
                arg_name += " " + args[i];
            if (arg_name == undefined || arg_name == "")
                arg_name = "Плейлист долбаёба";
            file.body.push(
                {
                    author: message.author.id, 
                    name: arg_name,
                    size: 0,
                    tracks: []
                });
            file.size++;
            return ["Создан плейлист \'" + arg_name + "\'"];

        case "delete":
            var msg = "";
            var n = parseInt(args.shift()) - 1;
            if (n < 0 || n >= file.size || isNaN(n))
                msg += await rephrase(errors.playlist.invalid_number2);
            else
            {
                if (file.body[n].author != message.author.id)
                    msg += await rephrase(errors.playlist.not_owner_delete);
                else
                {
                    var del_name = file.body[n].name;
                    file.body.splice(n, 1);
                    file.size--;
                    msg += "Удалили плейлист \'" + del_name + "\'";
                }
            }
            return [msg];
        
        case "add":
            var msg = "";
            var n = parseInt(args.shift()) - 1;
            if (n < 0 || n >= file.size || isNaN(n))
                msg += await rephrase(errors.playlist.invalid_number2);
            else
            {
                if (file.body[n].author != message.author.id)
                    msg += await rephrase(errors.playlist.not_owner_add);
                else
                {
                    var arg_name = args.shift();
                    for (var i = 0; i < args.length; i++)
                        arg_name += " " + args[i];
                    if (arg_name == undefined || arg_name == "")
                        arg_name += "Автор - придурок, не умеющий писать названия";
                    file.body[n].tracks.push(arg_name);
                    file.body[n].size++;
                    msg += "В плейлист \'" + file.body[n].name + "\' ";
                    msg += "добавлено \'" + arg_name + "\'";
                }
            }
            return [msg];
        
        case "remove":
            var msg = "";
            var n = parseInt(args.shift()) - 1;
            if (n < 0 || n >= file.size || isNaN(n))
                msg += await rephrase(errors.playlist.invalid_number1);
            else
            {
                if (file.body[n].author != message.author.id)
                    msg += await rephrase(errors.playlist.not_owner_remove);
                else
                {
                    var m = parseInt(args.shift()) - 1;
                    if (m < 0 || m >= file.body[n].size || isNaN(m))
                        msg += await rephrase(errors.playlist.invalid_number3);
                    else
                    {
                        var del_name = file.body[n].tracks[m];
                        file.body[n].tracks.splice(m, 1);
                        file.body[n].size--;
                        msg += "Из плейлиста \'" + file.body[n].name + "\' ";
                        msg += "удаляем \'" + del_name + "\'";
                    }
                }
            }
            return [msg];

        case "play":
            var n = parseInt(args.shift()) - 1;
            var msg = "";
            if (n < 0 || n >= file.size || isNaN(n))
                msg = await rephrase(errors.playlist.invalid_number1);
            else
            {
                for (var i = 0; i < file.body[n].size; i++)
                {
                    var k = i + 1;
                    msg += k + "\. " + (await command_play({message: message, args: [file.body[n].tracks[i]]})) + "\n";
                }
            }
            return [msg];
    }
    return [await rephrase(errors.playlist.invalid_query)];
}

module.exports.command_playlist = command_playlist;