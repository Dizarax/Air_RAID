var current_material = 0;
var current_food = 0;
var current_chemical = 0;

var current_directive = "rd0";

const game_length_in_seconds = 145;
const tick_per_second = 40;
const game_length_in_ticks = game_length_in_seconds * tick_per_second;
var current_game_tick_count = 0;

const production_time_in_seconds = {"rifl": 20, "ammo": 10, "food": 10, "medi": 15};
const production_resources = {"rifl": [15, 0, 5], "ammo": [5, 0, 5], "food": [5, 10, 0], "medi": [5, 0, 15]};

var factory_queue = [];
var warehouse_1_items = [];
var warehouse_2_items = [];
var time_left_for_cur_item = -1;

var gameUpdateLoopInterval;

function setup(){
    //assign event listeners
    document.getElementById("rd0").addEventListener("click", directiveOnClick);
    document.getElementById("rd1").addEventListener("click", directiveOnClick);
    
    var produce_btns = document.getElementsByClassName("produce");
    for (var i = 0; i < produce_btns.length; i++){
        produce_btns[i].addEventListener("click", produceOnClick);
    }
    
    document.getElementById("startgame").addEventListener("click", startgame);
    var playagain = document.getElementsByClassName("playagain");
    for(var ct=0; ct<playagain.length; ct++){
        playagain[ct].addEventListener("click", startgame);
    }
}

function startgame(){
    //initialize the values
    current_material = 80;
    current_food = 10;
    current_chemical = 55;
    current_game_tick_count = 0;
    current_directive = "rd0";
    time_left_for_cur_item = -1;
    factory_queue = [];
    warehouse_1_items = [];
    warehouse_2_items = [];
    update_factory_queue();
    renderWarehouses();
    
    document.getElementById("factory-countdown").innerHTML = "";
    
    //remove block
    document.getElementById("intro").classList.add("hiden");
    var bl = document.getElementsByClassName("blokk");
    for(var ct=0; ct<bl.length; ct++){
        bl[ct].classList.add("hiden");
    }
    //reset the warehouses
    document.getElementsByClassName("wh1")[0].style.backgroundImage = 'url("Sprites (UPDATED)/warehouseOne.png")';
    document.getElementsByClassName("wh2")[0].style.backgroundImage = 'url("Sprites (UPDATED)/warehouseTwo.png")';
    //start the update loop
    clearInterval(gameUpdateLoopInterval);
    gameUpdateLoopInterval = setInterval(gametick, 1000 / tick_per_second);
}

function gametick(){
    current_game_tick_count += 1;
    //update the 'time left' thing
    var secs_left = Math.ceil((game_length_in_ticks - current_game_tick_count) / tick_per_second);
    document.getElementById("timeleft").innerHTML = secs_left;
    
    //update the resources
    document.getElementById("contr-mat").innerHTML = current_material;
    document.getElementById("contr-food").innerHTML = current_food;
    document.getElementById("contr-chem").innerHTML = current_chemical;
    
    var warehouseChanged = false;
    
    //take care of production countdown
    if (time_left_for_cur_item > 0){
        time_left_for_cur_item -= 1;
        document.getElementById("factory-countdown").innerHTML = Math.ceil(time_left_for_cur_item / tick_per_second);
    } else if (time_left_for_cur_item < 0) {//if there is nothing in queue
        if (factory_queue.length > 0){
            var next_item = factory_queue[0].item;
            var multiplier = (current_directive === "rd1") ? 2.25 : 1;
            time_left_for_cur_item = production_time_in_seconds[next_item] * tick_per_second * multiplier;
            update_factory_queue();
        }
    } else {//if time left is 0
        var cooldown = false;
        if (factory_queue.length > 0){
            //update queue (pop the first item)
            var finished_item = factory_queue.shift();
            if (finished_item.directive === "rd0"){//rd0 produces 1 item
                if (warehouse_1_items.length > warehouse_2_items.length){
                    //if house 1 have more, put in house 2
                    warehouse_2_items.push(finished_item.item);
                } else {
                    //otherwise default to 1
                    warehouse_1_items.push(finished_item.item);
                }
                cooldown = finished_item.item;
            } else if (finished_item.directive === "rd1"){//rd1 produces 2 items
                warehouse_1_items.push(finished_item.item);
                warehouse_2_items.push(finished_item.item);
            }
        }
        
        warehouseChanged = true;
        
        if (factory_queue.length > 0){
            var next_item = factory_queue[0].item;
            
            var addtime = 0;
            //if there is cooldown
            if (cooldown === next_item){
                addtime = production_time_in_seconds[next_item] * tick_per_second * 0.4;
            }
            
            var multiplier = (factory_queue[0].directive === "rd1") ? 2.25 : 1;
            time_left_for_cur_item = production_time_in_seconds[next_item] * tick_per_second * multiplier + addtime;
        } else {
            document.getElementById("factory-countdown").innerHTML = "";
            time_left_for_cur_item = -1;
        }
        
        update_factory_queue();
    }
    
    //update if warehouse changed
    if (warehouseChanged) {
        renderWarehouses();
    }
    
    //when countdown is 0 game ends
    if (current_game_tick_count >= game_length_in_ticks){
        gameEnd();
    }
}

//update the graphics for the warehouse when they're changed
function renderWarehouses(){
    var wh1_elem = document.getElementById("wh1-q").getElementsByClassName("queue-itm");
    var wh2_elem = document.getElementById("wh2-q").getElementsByClassName("queue-itm");
    
    for (var ct=0; ct<4; ct++){
        wh1_elem[ct].classList.remove("b-rifl");
        wh1_elem[ct].classList.remove("b-ammo");
        wh1_elem[ct].classList.remove("b-food");
        wh1_elem[ct].classList.remove("b-medi");
        
        wh2_elem[ct].classList.remove("b-rifl");
        wh2_elem[ct].classList.remove("b-ammo");
        wh2_elem[ct].classList.remove("b-food");
        wh2_elem[ct].classList.remove("b-medi");
        
        if (ct < warehouse_1_items.length){
            wh1_elem[ct].classList.add("b-" + warehouse_1_items[ct]);
        }
        if (ct < warehouse_2_items.length){
            wh2_elem[ct].classList.add("b-" + warehouse_2_items[ct]);
        }
    }
}

//ending the game
function gameEnd(){
    clearInterval(gameUpdateLoopInterval);
    
    var ramd = Math.random();
    var safe;
    if (ramd >= 0.5){//destroy warehouse 1
        safe = warehouse_2_items;
        document.getElementsByClassName("wh1")[0].style.backgroundImage = 'url("Sprites (UPDATED)/warehouseDestroyed.png")';
    } else {//destroy warehouse 2
        safe = warehouse_1_items;
        document.getElementsByClassName("wh2")[0].style.backgroundImage = 'url("Sprites (UPDATED)/warehouseDestroyed.png")';
    }
    
    //if the item in the safe warehouse match, player wins
    if (checkItemsMatch(safe, ["rifl", "ammo", "rifl", "medi"]) || checkItemsMatch(safe, ["rifl", "food", "rifl", "medi"])){
        setTimeout(cueEndScreen, 1000, "victori");
    } else {
        setTimeout(cueEndScreen, 1000, "failure");
    }
}

//cue a end screen after a delay
function cueEndScreen(sta){
    document.getElementsByClassName(sta)[0].classList.remove("hiden");
}

//check if items match in two list (order doesn't matter)
function checkItemsMatch(lis1, lis2){
    if (lis1.length !== lis2.length){
        return false;
    }
    
    var match = true;
    var a1 = [...lis1].sort();
    var a2 = [...lis2].sort();
    
    for (var i = 0; i < a1.length; i++){
        match = match && (a1[i] === a2[i]);
    }
    
    return match;
}

//when a directive is selected
function directiveOnClick(event){
    document.getElementById("rd0").classList.remove("dire-selected");
    document.getElementById("rd1").classList.remove("dire-selected");
    
    var sauce = event.target;
    sauce.classList.add("dire-selected");
    current_directive = sauce.id;
}

//when a produce button is clicked
function produceOnClick(event){
    var targ = event.target;
    
    //if queue is smaller than 4 start production
    if (factory_queue.length < 4){
        var item_name = targ.id.replace("prod-", "");
        queue_production(item_name);
    }
}

//queue a production of an item
function queue_production(item){
    var resource_spent = production_resources[item];
    
    if (current_directive === "rd0"){
        if (current_material < resource_spent[0] || current_food < resource_spent[1] || current_chemical < resource_spent[2]){
            return;
        }
        
        current_material -= resource_spent[0];
        current_food -= resource_spent[1];
        current_chemical -= resource_spent[2];
    } else if (current_directive === "rd1"){
        if (current_material < 2 * resource_spent[0] || current_food < 2 * resource_spent[1] || current_chemical < 2 * resource_spent[2]){
            return;
        }
        
        current_material -= 2 * resource_spent[0];
        current_food -= 2 * resource_spent[1];
        current_chemical -= 2 * resource_spent[2];
    }
    
    factory_queue.push({"item": item, "directive": current_directive});
    update_factory_queue();
}

function update_factory_queue(){
    var factory_queue_td_elem = document.getElementById("factori-q").getElementsByClassName("queue-itm");
    var factory_queue_td_dire = document.getElementById("factori-q").getElementsByClassName("queue-dir");
    
    for (var i = 0; i < 4; i++){
        factory_queue_td_elem[i].classList.remove("b-rifl");
        factory_queue_td_elem[i].classList.remove("b-ammo");
        factory_queue_td_elem[i].classList.remove("b-food");
        factory_queue_td_elem[i].classList.remove("b-medi");
        factory_queue_td_dire[i].innerHTML = "";
        
        if (i < factory_queue.length){
            factory_queue_td_elem[i].classList.add("b-" + factory_queue[i].item);
            factory_queue_td_dire[i].innerHTML = factory_queue[i].directive;
        }
    }
}

document.addEventListener("DOMContentLoaded", setup);