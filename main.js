
if(GetPar("login")=="true")
{
    let user = GetPar("user")
    document.getElementById("loginatag").innerHTML = "Hellow " + user
}

function GetPar(loginPar)
{
    var ss = window.location.search.substring(1);
    var sURLVariables = ss.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == loginPar) 
        {
            return sParameterName[1]
        }
    }

}


