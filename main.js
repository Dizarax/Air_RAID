var sprites = {}

function setup(){
    //assign event listeners
    sprites["ammo"] = document.getElementById("img-ammo");
    sprites["food"] = document.getElementById("img-food");
    sprites["heal"] = document.getElementById("img-heal");
    sprites["guns"] = document.getElementById("img-guns");
}

document.addEventListener("DOMContentLoaded", setup);