const https = require("https");

async function send_request(options, data = null)
{
    var promise = new Promise((resolve) =>
    {
        var json = "";
        var req = https.request(options, (res) =>
        {
            res.on("data", (chunk) => json += String(chunk));
            res.on("end", () => resolve(json));
        });
        if (data != null)
            req.write(JSON.stringify(data));
        req.end();
    });
    var raw = await promise;
    return JSON.parse(raw);
}

function normalize(str)
{
    var res = "";
    for (var i = 0; i < str.length; i++)
    {
        if (("A" <= str[i] && str[i] <= "Z") || ("a" <= str[i] && str[i] <= "z") || ("0" <= str[i] && str[i] <= "9"))
            res += str[i];
        else
        {
            if (str[i] == " ")
                res += "+";
            else
                res += "%" + str.charCodeAt(i).toString(16);
        }
    }
    return res;
}

function string_params(data)
{
    var res = "";
    for (var key in data)
    {
        var lhs = String(key);
        var rhs = String(data[key]);
        res += normalize(lhs) + "=" + normalize(rhs) + "&";
    }
    res = res.substring(0, res.length - 1);
    return res;
}

module.exports.send_request = send_request;
module.exports.string_params = string_params;