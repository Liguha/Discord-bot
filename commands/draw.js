const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const { rephrase } = require("./chat.js")
const { Configuration, OpenAIApi } = require("openai");
const { AttachmentBuilder } = require('discord.js');
const https = require("https");

const configuration = new Configuration(
{
    apiKey: config.openai_api,
});
const openai = new OpenAIApi(configuration);

async function command_draw({message, args})
{
    var str = "";
    for (var i = 0; i < args.length; i++)
        str += args[i] + ' ';
    var image = message.attachments.values().next().value;
    var response = -1, ans = -1;
    if (image != null && image.contentType == "image/png")
    {
        var url = new URL(image.proxyURL);
        var promise = new Promise((resolve) => 
        {
            https.get(url, (stream) => resolve(stream));
        });
        var stream = await promise;
        response = await openai.createImageEdit(
            stream,
            str,
            undefined,
            1,
            "512x512"
        ).catch(async (err) => ans = await rephrase(errors.openai_module.general));
    }
    else
    {
        response = await openai.createImage(
        {
            prompt: str,
            n: 1,
            size: "512x512",
        }).catch(async (err) => ans = await rephrase(errors.openai_module.general));
    }
    if (ans == -1)
    {
        var url = new URL(response.data.data[0].url);
        var promise = new Promise((resolve) => 
        {
            https.get(url, (stream) => resolve(stream));
        });
        var stream = await promise;
        ans = {files: [new AttachmentBuilder(stream)]};
    }
    return [ans];
}

module.exports.command_draw = command_draw;