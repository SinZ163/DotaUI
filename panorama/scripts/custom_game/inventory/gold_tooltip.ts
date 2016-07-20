// Generated by TypeScript

function update() {
    let heroLevel = Players.GetLevel(Players.GetLocalPlayer());
    let buybackCost = 100 + (heroLevel*heroLevel*1.5) + ((Game.GetDOTATime(false,false)/60) * 15);
    let buybackSurplus = Players.GetGold(Players.GetLocalPlayer()) - buybackCost - (heroLevel * 30);
    $("#reliable").SetDialogVariableInt("reliable_gold", Players.GetReliableGold(Players.GetLocalPlayer()));
    $("#unreliable").SetDialogVariableInt("unreliable_gold", Players.GetUnreliableGold(Players.GetLocalPlayer()));
    $("#deathCost").SetDialogVariableInt("death_cost", heroLevel * 30);
    $("#buybackCost").SetDialogVariableInt("buyback_cost", buybackCost);

    //Buyback Cooldown
    let buybackTime = Players.GetLastBuybackTime(Players.GetLocalPlayer());
    if (buybackTime == 0) {
        //Never bought back before, meaning its available.
        (<Label>$("#buybackCooldown")).text = $.Localize("#DOTA_HUD_BuybackCooldownReady");
    } else {
        //$.Msg(buybackTime + " | " + Game.GetDOTATime(false,false) + " | " + (buybackTime + (60*7)));
        buybackTime = buybackTime + (60*7) -Game.GetGameTime();
        //$.Msg(buybackTime);
        //We have bought back before.
        if (buybackTime > 0) {
            $("#buybackCooldown").SetDialogVariable("buyback_cooldown", Math.floor(buybackTime/60) + ":" + ("00" + Math.floor(buybackTime % 60)).slice(-2));
            (<Label>$("#buybackCooldown")).text = $.Localize("#DOTA_HUD_BuybackCooldownNotReady", $("#buybackCooldown"));
        } else {
            (<Label>$("#buybackCooldown")).text = $.Localize("#DOTA_HUD_BuybackCooldownReady");
        }
    }

    //Buyback Surplus/Needed
    $("#buybackCostExtra").SetHasClass("Surplus", buybackSurplus > -1);
    if (buybackSurplus > -1) {
        $("#buybackCostExtra").SetDialogVariableInt("buyback_gold_surplus", buybackSurplus);
        (<Label>$("#buybackCostExtra")).text = $.Localize("#DOTA_HUD_BuybackCost_Surplus", $("#buybackCostExtra"));
    } else {
        $("#buybackCostExtra").SetDialogVariableInt("buyback_gold_needed", Math.abs(buybackSurplus));
        (<Label>$("#buybackCostExtra")).text = $.Localize("#DOTA_HUD_BuybackCost_Needed", $("#buybackCostExtra"));  
    }
}
update();
GameEvents.Subscribe("dota_money_changed", update);