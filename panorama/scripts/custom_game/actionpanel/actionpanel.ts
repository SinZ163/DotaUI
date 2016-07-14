/// <reference path="../../../dota.d.ts" />
/// <reference path="abilitypanel.ts" />

(function() {
    // Bitmask enum
    enum SilenceState {
        None = 0,
        Abilities = 1,
        Passives = 2,
        All = 3
    }

    let ItemDB = {
        587   : "default",
        10150 : "dire",
        10324 : "portal",
        11349 : "mana_pool" // ID is actually TI5, I don't have mana pool to test though
        // 10346 : "mana_pool"
    };

    let units = {};
    let currentUnit = -1;
    let abilities = <{[key: number]: AbilityPanel}>{};
    let learnMode = false;
    let silenceState = SilenceState.None;

    /* Set actionpanel for a specified unit. */
    function SetActionPanel(unit) {
        let abilityContainer = $("#AbilitiesContainer");

        // Get rid of the old abilities first.
        for (let ab in abilities) {
            abilities[ab].panel.style.visibility = "collapse";
        }

        // Remove old ability layout
        abilityContainer.RemoveClass("AbilityLayout" + countAbilityLayout(currentUnit));

        // Set the new current unit
        currentUnit = unit;

        // Retrieve panels we made previously to avoid deletion or excessive panels.
        if (units[unit] !== undefined) {
            abilities = units[unit];
        }
        else {
            units[unit] = {};
            abilities = units[unit];
        }

        // Update abilities on the action bar (can be swapped on invoker/rubick).
        updateVisibleAbilities();

        // Can not enter a unit in learn mode
        learnMode = false;
        for (let ab in abilities) {
            abilities[ab].setLearnMode(learnMode);
        }

        // Set silence state only for allies
        if (!Entities.IsEnemy(unit)) {
            silenceState = getSilenceState(unit);
            for (let ab in abilities) {
                abilities[ab].setSilenceState(silenceState);
            }
        }

        // Set ability layout
        abilityContainer.AddClass("AbilityLayout" + countAbilityLayout(unit));
    }

    /* Selection changed to a unit the player controls. */
    function onUpdateSelectedUnit(event) {
        let unit = Players.GetLocalPlayerPortraitUnit();
        SetActionPanel(unit);
    }

    /* Selection changed to a unit the player does not control. */
    function onUpdateQueryUnit(event) {
        let unit = Players.GetQueryUnit(Players.GetLocalPlayer());

        // Filter out invalid units (happens when switching back to the hero from a query unit.)
        // This also fires an update_selected_unit event so should be handled fine.
        if (unit !== -1) {
            SetActionPanel(unit);
        }
    }

    function onStatsChanged(event) {
        // Ability points changed - reinit all abilities
        for (let ab in abilities) {
            abilities[ab].reinit();
        }

        // Update stats?
    }

    function onAbilityChanged(event) {
        updateVisibleAbilities();
    }

    function onSteamInventoryChanged(event) {
        let skinName = ItemDB[event.itemdef];
        $.Msg(skinName);
        if (skinName !== undefined) {
            $("#MinimapBorder").style.backgroundImage = "url('s2r://panorama/images/hud/" + skinName + "/actionpanel/minimapborder.png');";
            // WTF DO WE DO NOW WITH DIFFERENT RESOLUTIONS!!
            $("#MinimapSpacer").style.backgroundImage = "url('s2r://panorama/images/hud/" + skinName + "/actionpanel/spacer_16_9.png');";
            // TODO: spacer_16_10
            // WTF DO WE DO NOW WITH DIFFERENT RESOLUTIONS!!
            // TODO: portrait
            $("#PortraitBorder").style.backgroundImage = "url('s2r://panorama/images/hud/" + skinName + "/actionpanel/portrait_wide.png');";
            $("#center_left_wide").style.backgroundImage = "url('s2r://panorama/images/hud/" + skinName + "/actionpanel/center_left_wide.png');";
            // TODO: center_left
            $("#center_right").style.backgroundImage = "url('s2r://panorama/images/hud/" + skinName + "/actionpanel/center_right.png');";
            $.Msg($("#MinimapBorder").style.backgroundImage);
        }
        $.Msg(event);
    }

    function updateVisibleAbilities() {
        let abilityContainer = $("#AbilitiesContainer");

        // Hide all abilities
        for (let ab in abilities) {
            abilities[ab].panel.style.visibility = "collapse";
        }

        // Show only the visible abilities
        let slot = 0;
        let abilityCount = Entities.GetAbilityCount(currentUnit) - 1;
        while (slot < abilityCount) {
            // Get ability.
            let ability = Entities.GetAbility(currentUnit, slot);

            // Stop once an invalid ability is found (or just continue and ignore?)
            if (ability === -1) {
                break;
            }

            if (!Abilities.IsAttributeBonus(ability) && !Abilities.IsHidden(ability)) {
                if (abilities[ability] !== undefined) {
                    abilities[ability].panel.style.visibility = "visible";

                    // Reinit the ability to check for changes
                    abilities[ability].reinit();
                }
                else {
                    // Create new panel and load the layout.
                    let abilityPanel = new AbilityPanel(abilityContainer, ability, currentUnit);

                    // Keep ability for later
                    abilities[ability] = abilityPanel;
                }

                if (slot > 0) {
                    let previousAbility = Entities.GetAbility(currentUnit, slot - 1);
                    if (abilities[previousAbility] !== undefined) {
                        abilityContainer.MoveChildAfter(abilities[ability].panel, abilities[previousAbility].panel);
                    }
                }
            }

            slot++;
        }
    }

    /* Count the abilities to show up in the ability layout. */
    function countAbilityLayout(unit) {
        let count = 0;
        for (let slot = 0; slot < Entities.GetAbilityCount(currentUnit); slot++) {
            let ability = Entities.GetAbility(unit, slot);

            if (ability === -1) {
                break;
            }

             if (!Abilities.IsAttributeBonus(ability) && !Abilities.IsHidden(ability)) {
                count++;
             }
        }
        return count;
    }

    /* Get the silence state (abilities, passives or both) */
    function getSilenceState(unit) {
        let state = SilenceState.None;
        if (Entities.IsSilenced(unit) || Entities.IsHexed(unit)) state += SilenceState.Abilities;
        if (Entities.PassivesDisabled(unit)) state += SilenceState.Passives;
        return state;
    }

    /* Update loop */
    function onUpdate() {
        // Check if we are in ability learn mode
        if (Game.IsInAbilityLearnMode() !== learnMode) {
            learnMode = Game.IsInAbilityLearnMode();
            for (let ab in abilities) {
                abilities[ab].setLearnMode(learnMode);
            }
        }

        // Make ability state only visible to allies (this can be commented out to see enemy ability states!)
        if (!Entities.IsEnemy(currentUnit)) {
            // Check silence state
            let silenceS = getSilenceState(currentUnit);
            if (silenceS !== silenceState) {
                silenceState = silenceS;
                for (let ab in abilities) {
                    abilities[ab].setSilenceState(silenceState);
                }
            }

            // Update all abilities.
            for (let ab in abilities) {
                abilities[ab].update();
            }
        }

        $.Schedule(0.005, onUpdate);
    }

    // Bind query unit update event
    GameEvents.Subscribe("dota_player_update_selected_unit", onUpdateSelectedUnit);
    GameEvents.Subscribe("dota_player_update_query_unit", onUpdateQueryUnit);

    GameEvents.Subscribe("dota_portrait_unit_stats_changed", onStatsChanged);
    GameEvents.Subscribe("dota_ability_changed", onAbilityChanged);
    // Listen for hacky inventory updates
    GameEvents.Subscribe("inventory_updated", onSteamInventoryChanged);

    // Set default unit
    let unit = Players.GetQueryUnit(Players.GetLocalPlayer());
    if (unit === -1 ) {
        unit = Players.GetLocalPlayerPortraitUnit();
    }
    SetActionPanel(unit);

    // Listen to dota_action_success to determine cast state
    onUpdate();

    // Listen for level up event - dota_ability_changed

    // Listen for casts (cooldown starts)
})();