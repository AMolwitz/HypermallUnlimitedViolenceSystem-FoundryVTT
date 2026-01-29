import { HypermallActor } from "./actor-sheet.mjs";
export class HypermallNPCSheet extends HypermallActor {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hypermall", "sheet", "actor"],
      template: "systems/hypermalluv/templates/actor/npc-sheet.html",
      width: 1100,
      height: 475
    });
  }

  /** @override */
  async getData() {
    const data = super.getData();

    const actorData = this.actor.toObject(false);

    if (actorData.system.meat == undefined) {
      actorData.system.meat = {};
      actorData.system.meat.value = 2;
    }

    if (actorData.system.stress == undefined) {
      actorData.system.stress = {};
      actorData.system.stress.value = 2;
    }

    if (actorData.system.debt == undefined) {
      actorData.system.debt = {};
      actorData.system.debt.value = 0;
    }

    data.system = actorData.system;

    data.enrichedBackground = await TextEditor.enrichHTML(data.system.background)
    data.enrichedPhrenology = await TextEditor.enrichHTML(data.system.phrenology)
    data.enrichedMoves = await TextEditor.enrichHTML(data.system.moves)
    data.enrichedMutations = await TextEditor.enrichHTML(data.system.mutations)
    data.enrichedPsionics = await TextEditor.enrichHTML(data.system.psionics)
    data.enrichedQuote = await TextEditor.enrichHTML(data.system.quote)
    data.enrichedInventory = await TextEditor.enrichHTML(data.system.inventory)

    return data;
  }
}
