import { HypermallActor } from "./actor-sheet.mjs";
import { getCompatibleTextEditor } from "../../utils/compatibility.mjs";

export class HypermallNPCSheet extends HypermallActor {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hypermall", "sheet", "actor"],
      template: "systems/hypermalluv/templates/actor/npc-sheet.html",
      width: 1100,
      height: 475,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
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

    context.system = actorData.system;
    
    const textEditor = getCompatibleTextEditor()
    //data.system = actorData.system;

    data.enrichedBackground = await TextEditor.enrichHTML(data.system.background)
    data.enrichedPhrenology = await TextEditor.enrichHTML(data.system.phrenology)
    data.enrichedMoves = await TextEditor.enrichHTML(data.system.moves)
    //data.enrichedMutations = await TextEditor.enrichHTML(data.system.mutations)
    context.enrichedPsionics = await textEditor.enrichHTML(context.system.psionics)
    context.enrichedMutations = await textEditor.enrichHTML(context.system.mutations)
    data.enrichedQuote = await TextEditor.enrichHTML(data.system.quote)
    context.enrichedGear = await textEditor.enrichHTML(context.system.allGear)

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    html.find('.hypermall-mt-indicator').change(async (event) => {
      const eventValue = parseInt(event.target.value);
      const actorValue = this.actor.system?.meat;
      await this._validateAndPersistThreshold(eventValue, event.target, actorValue, 'system.meat.max');
    });

    html.find('.hypermall-st-indicator').change(async (event) => {
      const eventValue = parseInt(event.target.value);
      const actorValue = this.actor.system?.st;
      await this._validateAndPersistThreshold(eventValue, event.target, actorValue, 'system.stress.max');
    });

    html.find('.hypermall-dt-indicator').change(async (event) => {
      const eventValue = parseInt(event.target.value);
      const actorValue = this.actor.system?.dt;
      await this._validateAndPersistThreshold(eventValue, event.target, actorValue, 'system.debt.max');
    });
  }

  async _validateAndPersistThreshold(eventValue, eventTarget, actorValue, fieldName) {
    try {
      if (!actorValue) return;
      if (isNaN(eventValue)) {
        eventTarget.value = actorValue.value ?? 0;
        return;
      }
      //const min = Number(actorValue.min ?? 0);
      const max = 6;//Number(actorValue.max);
      const current = Number(actorValue?.value ?? 0);
      if (eventValue > max) {
        const update = {};
        update[fieldName] = max;
        await this.actor.update(update);
      }
      else {
        const update = {};
        update[fieldName] = eventValue;
        await this.actor.update(update);
      }
    } catch (err) {
      console.error('validateThresholdChange error:', err);
    }
  }

}
