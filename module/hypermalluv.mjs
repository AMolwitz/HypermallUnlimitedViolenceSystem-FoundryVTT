// Import document classes.
import { HypermallActor } from "./documents/actor.mjs";
import { HypermallEquipment } from "./documents/equipment.mjs";
// Import sheet classes.
import { HypermallContractorSheet } from "./sheets/actor/contractor-sheet.mjs";
import { HypermallNPCSheet } from "./sheets/actor/npc-sheet.mjs";
import { HypermallEquipmentSheet } from "./sheets/equipment/gear-sheet.mjs";
import { HypermallEffectSheet } from "./sheets/equipment/effect-sheet.mjs";
import { HypermallMutationSheet } from "./sheets/equipment/mutation-sheet.mjs";
import { HypermallPsionicSheet } from "./sheets/equipment/psionic-sheet.mjs";
import { HypermallTagsSheet } from "./sheets/equipment/tags-sheet.mjs";
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import {
  HypermallContractorData,
  HypermallNPCData,
  HypermallEquipmentData,
  HypermallEffectData,
  HypermallTagsData
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

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */
export const socketEventChannel = "system.hypermalluv";
const DARK_MODE_CLASS = "hypermalluv-dark-mode";

function applyDarkMode(enabled) {
  document.body.classList.toggle(DARK_MODE_CLASS, Boolean(enabled));
}

async function seedCoreRolltablesFromCompendium() {
  const packId = "hypermalluv.core-rolltables";
  const pack = game.packs.get(packId)
    ?? game.packs.find((collection) => (
      collection.metadata?.packageName === "hypermalluv"
      && collection.metadata?.name === "core-rolltables"
    ));

  if (!pack) {
    const availablePacks = Array.from(game.packs.keys()).join(", ");
    console.error(`hypermalluv | Could not find compendium pack ${packId}. Available packs: ${availablePacks}`);
    return false;
  }

  const documents = await pack.getDocuments();

  for (const document of documents) {
    const existing = game.tables.getName(document.name);
    if (existing) continue;

    await RollTable.create(document.toObject(), { renderSheet: false });
  }

  return true;
}

async function seedStarterEffectsLibrary() {
  const folderName = "HypermallUV Starter Effects";
  let folder = game.folders.find((entry) => entry.type === "Item" && entry.name === folderName);

  if (!folder) {
    folder = await Folder.create({
      name: folderName,
      type: "Item",
      color: "#4c7495",
    });
  }

  const starterEffects = [
    {
      name: "Starter Effect: Physick Up",
      system: {
        description: "Increases Physick by 1 while this effect is present.",
        rules: [
          { path: "system.abilities.physick.value", operation: "add", value: "1" }
        ],
      },
    },
    {
      name: "Starter Effect: Craveability Down",
      system: {
        description: "Decreases Craveability by 1 while this effect is present.",
        rules: [
          { path: "system.abilities.craveability.value", operation: "subtract", value: "1" }
        ],
      },
    },
    {
      name: "Starter Effect: Astral Navigation Up",
      system: {
        description: "Increases Astral Navigation by 1 while this effect is present.",
        rules: [
          { path: "system.skills.astralNavigation.value", operation: "add", value: "1" }
        ],
      },
    },
    {
      name: "Starter Effect: Dodge Up",
      system: {
        description: "Increases Dodge by 1 while this effect is present.",
        rules: [
          { path: "system.derived.dodge.value", operation: "add", value: "1" }
        ],
      },
    },
    {
      name: "Starter Effect: Armour Set 3",
      system: {
        description: "Sets armour to 3 while this effect is present.",
        rules: [
          { path: "system.armour", operation: "set", value: "3" }
        ],
      },
    },
    {
      name: "Starter Effect: Stress Max Down",
      system: {
        description: "Decreases Stress max by 2 while this effect is present.",
        rules: [
          { path: "system.stress.max", operation: "subtract", value: "2" }
        ],
      },
    },
    {
      name: "Starter Effect: Power Uses Up",
      system: {
        description: "Increases Power Uses by 1 while this effect is present.",
        rules: [
          { path: "system.psiPower", operation: "add", value: "1" },
          { path: "system.powerUses.value", operation: "add", value: "1" }
        ],
      },
    },
  ];

  for (const effect of starterEffects) {
    const exists = game.items.some((item) => (
      item.type === "effect"
      && item.name === effect.name
      && item.folder?.id === folder.id
    ));

    if (exists) continue;

    await Item.create({
      name: effect.name,
      type: "effect",
      img: "icons/svg/aura.svg",
      folder: folder.id,
      system: effect.system,
    }, { renderSheet: false });
  }

  return true;
}

Hooks.once('init', async function () {

  // Define custom Document classes
  CONFIG.Actor.documentClass = HypermallActor;
  CONFIG.Item.documentClass = HypermallEquipment;

  Object.assign(CONFIG.Actor.dataModels, {
    contractor: HypermallContractorData,
    npc: HypermallNPCData,
  });

  Object.assign(CONFIG.Item.dataModels, {
    gear: HypermallEquipmentData,
    effect: HypermallEffectData,
    psionic: HypermallEquipmentData,
    mutation: HypermallEquipmentData,
    tags: HypermallTagsData
  });

  // Preload Handlebars partial templates so sheet partials are available
  await preloadHandlebarsTemplates();

  // Register Handlebars helpers
  Handlebars.registerHelper('array', function(...args) {
    return args.slice(0, -1); // Remove the last arg (Handlebars context object)
  });

  Handlebars.registerHelper('add', function(a, b) {
    return a + b;
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper('lookup', function(obj, key) {
    return obj?.[key];
  });

  // Register sheet application classes
  actors.unregisterSheet("core", getCompatibleActorSheet());
  items.unregisterSheet("core", getCompatibleItemSheet());
  actors.registerSheet("hypermalluv", HypermallContractorSheet, { types: ["contractor"], makeDefault: true });
  actors.registerSheet("hypermalluv", HypermallNPCSheet, { types: ["npc"], makeDefault: false });
  items.registerSheet("hypermalluv", HypermallEquipmentSheet, { types: ["gear"], makeDefault: true });
  items.registerSheet("hypermalluv", HypermallEffectSheet, { types: ["effect"], makeDefault: true });
  items.registerSheet("hypermalluv", HypermallMutationSheet, { types: ["mutation"], makeDefault: true });
  items.registerSheet("hypermalluv", HypermallPsionicSheet, { types: ["psionic"], makeDefault: true });
  items.registerSheet("hypermalluv", HypermallTagsSheet, { types: ["tags"], makeDefault: true });

  // Register settings
  game.settings.register("hypermalluv", "worldKey", {
    name: "Unique world key",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  game.settings.register("hypermalluv", "coreRolltablesSeeded", {
    name: "Core rolltables seeded",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("hypermalluv", "starterEffectsSeeded", {
    name: "Starter effects seeded",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register("hypermalluv", "darkMode", {
    name: "Dark Mode",
    hint: "Use a darker visual theme for HypermallUV sheets.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => applyDarkMode(value),
  });

});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  applyDarkMode(game.settings.get("hypermalluv", "darkMode"));

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to

  if (game.user.isGM && !game.settings.get("hypermalluv", "coreRolltablesSeeded")) {
    const seeded = await seedCoreRolltablesFromCompendium();
    if (seeded) {
      await game.settings.set("hypermalluv", "coreRolltablesSeeded", true);
      ui.notifications.info("HypermallUV: Core rolltables imported to this world.");
    }
  }

  if (game.user.isGM && !game.settings.get("hypermalluv", "starterEffectsSeeded")) {
    const seeded = await seedStarterEffectsLibrary();
    if (seeded) {
      await game.settings.set("hypermalluv", "starterEffectsSeeded", true);
      ui.notifications.info("HypermallUV: Starter effect library created.");
    }
  }


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