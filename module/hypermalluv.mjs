// Import document classes.
import { HypermallActor } from "./documents/actor.mjs";
import { HypermallEquipment } from "./documents/equipment.mjs";
// Import sheet classes.
import { HypermallContractorSheet } from "./sheets/actor/contractor-sheet.mjs";
import { HypermallNPCSheet } from "./sheets/actor/npc-sheet.mjs";
//import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import {
  HypermallContractorData,
  HypermallNPCData,
  HypermallEquipmentData
} from "./data/index.mjs";
import { getCompatibleActorsObject, getCompatibleItemsObject, getCompatibleActorSheet, getCompatibleItemSheet } from "./utils/compatibility.mjs";

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.hypermalluv = {
    HypermallActor,
    HypermallEquipment
  };
  const items = getCompatibleItemsObject();
  const actors = getCompatibleActorsObject();

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
export const socketEventChannel = "system.hypermall";

Hooks.once('init', async function () {

  // Register sheet application classes
actors.unregisterSheet("core", getCompatibleActorSheet());
items.unregisterSheet("core", getCompatibleItemSheet());
actors.registerSheet("hypermall", HypermallContractorSheet, { types: ["contractor"], makeDefault: true });
actors.registerSheet("hypermall", HypermallNPCSheet, { types: ["npc"], makeDefault: false });
items.registerSheet("hypermall", HypermallEquipmentSheet, { types: ["equipment"], makeDefault: true });

});


/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to


  // Style items when dragging from the sidebar.
  let draggedElement = null;
  let clickTimeout = null;

  document.body.addEventListener('mousedown', (event) => {
    if (draggedElement) draggedElement.classList.remove('hypermall-dragging-item');
    clearTimeout(clickTimeout);

    const itemElement = event.target.closest('li.directory-item.item');
    if (itemElement) {
      draggedElement = itemElement;
      draggedElement.classList.add('hypermall-dragging-item');

      // Set a timeout. If mouseup happens before this, it's a click.
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
      }, 200);
    }
  });

  document.body.addEventListener('mouseup', () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      if (draggedElement) draggedElement.classList.remove('hypermall-dragging-item');
      draggedElement = null;
    }
  });

  document.body.addEventListener('dragend', () => {
    if (draggedElement) {
      draggedElement.classList.remove('hypermall-dragging-item');
      draggedElement = null;
    }
  });
});