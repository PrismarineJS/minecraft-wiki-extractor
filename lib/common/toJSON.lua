local json='{'
for k, v in pairs( aliases ) do
   json=json..'"'..k..'"'..':'..'"'.. v..'"'..','
end
return json