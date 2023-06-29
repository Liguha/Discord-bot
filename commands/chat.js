const config = require("../json/static_config.json");
const errors = require("../json/error_reports.json");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration(
{
    apiKey: config.openai_api,
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

async function command_chat({args})
{
    var str = 'Ответь как быдло: ';
    for (var i = 0; i < args.length; i++)
        str += args[i] + ' ';
    
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

async function refresh()
{
    history = [];
    return [await rephrase("Я всё забыл")];
}

module.exports.command_chat = command_chat;
module.exports.rephrase = rephrase;
module.exports.refresh = refresh;