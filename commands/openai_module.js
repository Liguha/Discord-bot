const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const { Configuration, OpenAIApi } = require("openai");
const { AttachmentBuilder } = require('discord.js');
const https = require("https");

const configuration = new Configuration(
{
    apiKey: config.openai_api[0],
});
const openai = new OpenAIApi(configuration);

var history = [];

async function rephrase(orig)
{
    var str = "Перефразируй как быдло: \"" + orig + "\", напиши только итоговую фразу";
    var res = -1;
    const completion = await openai.createChatCompletion(
    {
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: str}]
    }).catch((err) => res = errors.openai_module.rephrase_err);
    if (res == -1)
        res = completion.data.choices[0].message.content;
    return res;
}

function parse(text)
{
    for (var i = 0; i < text.length - 1; i++)
    {
        if (text[i] == '\\' && text[i] == 'n')
        {
            text[i] = ' ';
            text[i + 1] = '\n';
        }
    }
}

function make_messages(text)
{
    var msg = new Array();
    var idx = 0, cnt = 0;
    var block = 0, lang = '';
    msg.push('');
    parse(text);
    for (var i = 0; i < text.length; i++)
    {
        if (cnt >= 1950 && text[i] == ' ')
        {
            idx++;
            cnt = 0;
            msg.push('');
            if (block % 2 == 1)
            {
                msg[idx] += "```" + lang + "\n";
                msg[idx - 1] += "\n```";
            }
            continue;
        }
        if (text.substring(i, i + 3) == "```")
        {
            block++;
            lang = '';
            for (var j = i + 3; text[j] != ' ' && text[j] != '\n'; j++)
                lang += text[j];
        }
        msg[idx] += text[i];
        cnt++;
    }
    return msg;
}

async function command_chat(message, args)
{
    var str = 'Ответь как быдло: ';
    for (var i = 0; i < args.length; i++)
        str += args[i] + ' ';
    message.channel.sendTyping();
    var completion = -1;
    var interval = setInterval(() => 
    {
        if (completion == -1)
            message.channel.sendTyping();
        else
            clearInterval(interval);
    }, 10000);

    history.push({role: "user", content: str});
    msg = -1;
    var completion = await openai.createChatCompletion(
    {
        model: "gpt-3.5-turbo",
        messages: history
    }).catch(async (err) => msg = [await rephrase(errors.openai_module.general)]);
    if (msg == -1)
    {
        history.push(completion.data.choices[0].message);
        msg = make_messages(completion.data.choices[0].message.content);
    }
    return msg;
}

async function command_draw(message, args)
{
    var str = "";
    for (var i = 0; i < args.length; i++)
        str += args[i] + ' ';
    message.channel.sendTyping();
    var ended = false;
    var interval = setInterval(() => 
    {
        if (!ended)
            message.channel.sendTyping();
        else
            clearInterval(interval);
    }, 10000);
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
    ended = true;
    return [ans];
}

async function command_refresh()
{
    history = [];
    return [await rephrase("Я всё забыл")];
}

module.exports.rephrase = rephrase;
module.exports.command_chat = command_chat;
module.exports.command_draw = command_draw;
module.exports.command_refresh = command_refresh;