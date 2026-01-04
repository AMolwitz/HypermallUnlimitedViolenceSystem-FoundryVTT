// Import document classes.
import { HypermallActor } from "./documents/actor.mjs";
import { HypermallEquipment } from "./documents/equipment.mjs";
// Import sheet classes.
import { HypermallContractorSheet } from "./sheets/actor/contractor-sheet.mjs";
import { HypermallNPCSheet } from "./sheets/actor/npc-sheet.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import {
  HypermallContractorData,
  HypermallNPCData,
  HypermallEquipmentData
} from "./data/index.mjs";
import { registerGameSettings } from "./settings/settings.mjs";
import { getCompatibleActorsObject, getCompatibleItemsObject, getCompatibleActorSheet, getCompatibleItemSheet } from "./utils/compatibility.mjs";

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.hypermalluv = {
    HypermallActor,
    HypermallEquipment
  };
  const items = getCompatibleItemsObject();
  const actors = getCompatibleActorsObject();

  registerGameSettings()

  // Add custom constants for configuration.
  CONFIG.HYPERMALL = HYPERMALL;

  // Define custom Document classes
  CONFIG.Actor.documentClass = HypermallActor;
  CONFIG.Item.documentClass = HypermallEquipment;


  Object.assign(CONFIG.Actor.dataModels, {
    contractor: HypermallContractorData,
    npc: HypermallNPCData,
  });

  Object.assign(CONFIG.Item.dataModels, {
    equipment: HypermallEquipmentData
  })


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */
let skillDraftApp = null;
export const socketEventChannel = "system.paranoia";

Hooks.once('init', async function () {

  // Register sheet application classes
actors.unregisterSheet("core", getCompatibleActorSheet());
items.unregisterSheet("core", getCompatibleItemSheet());
actors.registerSheet("hypermall", HypermallContractorSheet, { types: ["contractor"], makeDefault: true });
actors.registerSheet("hypermall", HypermallNPCSheet, { types: ["npc"], makeDefault: false });
items.registerSheet("hypermall", HypermallEquipmentSheet, { types: ["equipment"], makeDefault: true });

});