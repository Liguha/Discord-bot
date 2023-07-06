const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const https = require("https");
const { createAudioResource } = require('@discordjs/voice');
const { send_request, string_params } = require("../scripts/https_requests");
const { queue_push } = require("../scripts/player_queue.js");
const { rephrase } = require("./chat.js");

async function ym_search(prompt)
{
    var data = 
    {
        text: prompt,
        lang: "ru",
        "external-domain": "music.yandex.ru"
    }
    var options =
    {
        host: "music.yandex.ru",
        path: "/handlers/music-search.jsx?" + string_params(data),
        method: "GET",
        headers:
        {
            Cookie: config.yandex_cookie
        }
    }

    var info = await send_request(options);
    var id_list = [];
    for (var i = 0; i < info.tracks.items.length && i < 20; i++)
    {
        var elem = info.tracks.items[i];
        var id =
        {
            track: String(elem.id),
            album: String(elem.albums[0].id),
            name: elem.title
        }
        id_list.push(id);
    }
    return id_list;
}

function split_url(url)
{
    var owner = null, kinds = null;
    var params = url.split("/");
    for (var i = 1; i < params.length; i++)
    {
        if (params[i - 1] == "users")
            owner = params[i];
        if (params[i - 1] == "playlists")
            kinds = params[i];
    }
    return [owner, kinds];
}

async function ym_playlist(url)
{
    var params = split_url(url)
    var data =
    {
        owner: params[0],
        kinds: params[1],
        light: true,
        madeFor: "",
        lang: "ru",
        overembed: false,
        "external-domain": "music.yandex.ru"
    }
    var options =
    {
        host: "music.yandex.ru",
        path: "/handlers/playlist.jsx?" + string_params(data),
        method: "GET",
        headers:
        {
            Cookie: config.yandex_cookie
        }
    }

    var info = await send_request(options);
    if (info.message == "Not Found" || info.message == "")
        return [];
    var id_list = [];
    for (var i = 0; i < info.playlist.trackIds.length; i++)
    {
        var track = info.playlist.tracks[i];
        if (track.albums.length == 0)
            continue;
        var id = 
        {
            track: track.id,
            album: track.albums[0].id,
            name: track.title
        }
        id_list.push(id);
    }
    return id_list;
}

async function ym_audio_by_id(id)
{
    var options =
    {
        host: "music.yandex.ru",
        path: "/api/v2.1/handlers/track/" + id.track + ":" + id.album + "/web-own_playlists-playlist-track-fridge/download/m?hq=0&external-domain=music.yandex.ru",
        method: "GET",
        headers:
        {
            Cookie: config.yandex_cookie,
            "X-Retpath-Y": "https://music.yandex.ru/album/" + id.album + "/track/" + id.track
        }
    }
    var info = await send_request(options);

    var n = 0;
    var host = "", path = "";
    for (var i = 2; i < info.src.length; i++)
    {
        if (info.src[i] == "/")
            n++;
        if (n == 0)
            host += info.src[i];
        else
            path += info.src[i];
    }

    options =
    {
        host: host,
        path: path + "&format=json",
        method: "GET"
    }
    info = await send_request(options);
    var ref = "https://" + info.host + "/get-mp3/0/" + info.ts + info.path;
    return ref;
}

function is_playlist(prompt)
{
    var params = split_url(prompt);
    if (params[0] == null || params[1] == null)
        return false
    return true;
}

async function get_resource(id)
{
    var ref = await ym_audio_by_id(id);
    var url = new URL(ref);
    var promise = new Promise((resolve) => 
    {
        https.get(url, (stream) => resolve(stream));
    });
    var stream = await promise;
    var resource = createAudioResource(stream, 
    {
        silencePaddingFrames: 50,
        inlineVolume: true
    });
    return resource;
}

async function command_yplay({message, args})
{
    var prompt = "";
    for (var i = 0; i < args.length; i++)
        prompt += " " + args[i];
    if (prompt.length > 0)
        prompt = prompt.slice(1);

    var songs = [];
    if (is_playlist(prompt))
    {
        var id_list = await ym_playlist(prompt);
        for (var i = 0; i < id_list.length; i++)
        {
            var song =
            {
                prompt: id_list[i].name,
                output: "https://music.yandex.ru/album/" + id_list[i].album + "/track/" + id_list[i].track,
                data: id_list[i],
                success: true,
                get_resource: get_resource
            }
            songs.push(song);
        }
    }
    else
    {
        var id_list = await ym_search(prompt);
        var output, ok = true;
        if (id_list.length > 0)
            output = "https://music.yandex.ru/album/" + id_list[0].album + "/track/" + id_list[0].track;
        else
        {
            output = await rephrase(errors.player_module.not_found);
            ok = false;
        }

        var song =
        {
            prompt: prompt,
            output: output,
            data: id_list[0],
            success: ok,
            get_resource: get_resource
        }
        return await queue_push(message, song);
    }
    var msg = ["Из плейлиста добавлено:"];
    var k = 0;
    for (var i = 0; i < songs.length; i++)
    {
        var str = await queue_push(message, songs[i]);
        var parts = str[0].split(" => ");
        if (msg[k].length > 1800)
        {
            k++;
            msg.push("");
        }
        msg[k] += "\n" + (i + 1) + ". " + parts[0] + " => <" + parts[1] + ">";
    }
    return msg;
}

module.exports.command_yplay = command_yplay;