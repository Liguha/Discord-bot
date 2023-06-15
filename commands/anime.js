const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const https = require('https');
const { AttachmentBuilder } = require('discord.js');
const { rephrase } = require("./openai_module.js");

async function send_request(options, data = null)
{
    var promise = new Promise((resolve) =>
    {
        var req = https.request(options, (res) =>
        {
            res.on("data", (json) => resolve(String(json)));
        });
        if (data != null)
            req.write(JSON.stringify(data));
        req.end();
    });
    var raw = await promise;
    return JSON.parse(raw);
}

var generate =
{
    host: "api.prodia.com",
    path: "/generate?<data>",
    method: "GET"
}

var check =
{
    host: "api.prodia.com",
    path: "/job/<job>",
    method: "GET"
}

function make_path(prompt, key = null)
{
    var res = "/generate?new=true&prompt=";
    for (var i = 0; i < prompt.length; i++)
    {
        if (("A" <= prompt[i] && prompt[i] <= "Z") || ("a" <= prompt[i] && prompt[i] <= "z"))
            res += prompt[i];
        else
            res += "%" + prompt.charCodeAt(i).toString(16);
    }
    res += "&model=anything-v4.5-pruned.ckpt+%5B65745d25%5D&negative_prompt=&steps=50&cfg=7&seed=";
    res += Math.floor(Math.random() * 9999999999);
    res += "&sampler=Heun";
    if (key != null)
        res += "&key=" + key;
    return res;
}

async function generate_image(prompt, key)
{
    generate.path = make_path(prompt, key);
    var info = await send_request(generate);
    check.path = "/job/" + info.job;
    while (true)
    {
        var state = await send_request(check);
        if (state.status == "succeeded")
            break;
    }
    var url = new URL("https://images.prodia.xyz/" + info.job + ".png");
    var promise = new Promise((resolve) => 
    {
        https.get(url, (stream) => resolve(stream));
    });
    var stream = await promise;
    return stream;
}

async function command_anime(args)
{
    var n = Number(args[0]);
    if (isNaN(n) || !(1 <= n && n <= 9))
        return [await rephrase(errors.anime.invalid_n)];

    var prompt = "";
    for (var i = 1; i < args.length; i++)
        prompt += args[i] + " ";
    var promise = [];
    var files = [];
    for (var i = 0; i < n; i++)
        promise.push(generate_image(prompt, config.anime_api));
    for (var i = 0; i < n; i++)
    {
        var stream = await promise[i];
        files.push(new AttachmentBuilder(stream));
    }
    return [{files: files}];
}

module.exports.command_anime = command_anime;