
/// <reference path="jquery-3.6.3.js" />
$(() => {
    addLoginEvents();
    addChartsEvents();
})


function gotocontactus() {
    document.getElementById('contactsection').scrollIntoView();
}
function gotohome() {
    document.getElementById('searchsection').scrollIntoView();
}

function addChartsEvents()
{
    // var modal = document.getElementById("ChartsModal");

    // var span = document.getElementsByClassName("closeChart")[0];

    // span.onclick = function () {
    //     modal.style.display = "none";
    // }

    // // When the user clicks anywhere outside of the modal, close it
    // window.onclick = function (event) {
    //     if (event.target == modal) {
    //         modal.style.display = "none";
    //     }
    // }
}

function addLoginEvents() {

    var modal = document.getElementById("loginModal");
    var modal2 = document.getElementById("errorModal");

    // Get the button that opens the modal
    var btn = document.getElementById("signup");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    var span2 = document.getElementsByClassName("close")[1];

    // When the user clicks the button, open the modal 
    btn.onclick = loginLogout;


    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }
    span2.onclick = function () {
        modal2.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
        if (event.target == modal2) {
            modal2.style.display = "none";
        }
    }
}

function loginLogout() {
    var modal = document.getElementById("loginModal");

    if (document.getElementById("signup").innerHTML.includes("Logout")) {
        // document.getElementById("username").innerHTML = "";
        document.getElementById("signup").innerHTML = "Login"
        return
    }
    modal.style.display = "block"
}
function login() {
    let user = document.getElementById("usernameinput").value;
    document.getElementById('loginModal').style.display = 'none'
    // document.getElementById("username").innerHTML = "Welcome " + user;
    document.getElementById("signup").innerHTML = "Hi <b>" + user + "</b>, Logout";
}

