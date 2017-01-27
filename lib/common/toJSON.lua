function getValue(v)
   if (type(v) == "table" and v['name'] ~= nil) then
        return v['name']
   else
        return v
   end
end
local json='{'
for k, v in pairs( aliases ) do
    if (type(v) == "table" and v['name'] == nil ) then
        for k2, v2 in pairs(v) do
            json=json..'"'..k..'"'..':'..'"'.. getValue(v2)..'"'..','
        end
    else
        json=json..'"'..k..'"'..':'..'"'.. getValue(v)..'"'..','
    end
end
return json