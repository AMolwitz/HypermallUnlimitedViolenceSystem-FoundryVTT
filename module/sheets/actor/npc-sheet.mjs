import { HypermallActor } from "./actor-sheet.mjs";
export class HypermallNPCSheet extends HypermallActor {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hypermall", "sheet", "actor"],
      template: "systems/hypermall/templates/actor/npc-sheet.html",
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
      actorData.system.meat.value = 0;
    }

    if (actorData.system.stress == undefined) {
      actorData.system.stress = {};
      actorData.system.stress.value = 0;
    }

    if (actorData.system.debt == undefined) {
      actorData.system.debt = {};
      actorData.system.debt.value = 0;
    }

    data.system = actorData.system;

    data.enrichedLooks = await TextEditor.enrichHTML(data.system.looks)
    data.enrichedQuirks = await TextEditor.enrichHTML(data.system.quirks)
    data.enrichedPlans = await TextEditor.enrichHTML(data.system.plans)
    data.enrichedBasics = await TextEditor.enrichHTML(data.system.basics)
    data.enrichedGear = await TextEditor.enrichHTML(data.system.gear)
    data.enrichedMutantPowers = await TextEditor.enrichHTML(data.system.mutantPowers)
    data.enrichedQuote = await TextEditor.enrichHTML(data.system.quote)

    return data;
  }
}
