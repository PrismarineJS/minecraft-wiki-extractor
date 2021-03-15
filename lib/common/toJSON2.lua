function toJSON(v)
    local result = {}
    for key, value in pairs(v) do
        if (type(value) == "table") then
            table.insert(result, string.format("\"%s\":%s", key, toJSON(value)))
        else
            table.insert(result, string.format("\"%s\":\"%s\"", key, value))
        end
    end
    result = "{" .. table.concat(result, ",") .. "}"
    return result
 end
return toJSON(data)