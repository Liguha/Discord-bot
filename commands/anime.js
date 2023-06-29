const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const https = require("https");
const { send_request, string_params } = require("../scripts/https_requests");
const { AttachmentBuilder } = require("discord.js");
const { rephrase } = require("./chat.js");

async function generate_image(prompt)
{
    var generate_data =
    {
        new: true,
        prompt: prompt,
        model: "anything-v4.5-pruned.ckpt [65745d25]",
        negative_prompt: "",
        steps: 50,
        cfg: 7,
        seed: Math.floor(Math.random() * 9999999999),
        sampler: "Heun",
        key: config.anime_api
    }
    var generate_options =
    {
        host: "api.prodia.com",
        path: "/generate?" + string_params(generate_data),
        method: "GET"
    }
    var info = await send_request(generate_options);

    var check =
    {
        host: "api.prodia.com",
        path: "/job/" + info.job,
        method: "GET"
    }
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

async function command_anime({args})
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
        promise.push(generate_image(prompt));
    for (var i = 0; i < n; i++)
    {
        var stream = await promise[i];
        files.push(new AttachmentBuilder(stream));
    }
    return [{files: files}];
}

module.exports.command_anime = command_anime;