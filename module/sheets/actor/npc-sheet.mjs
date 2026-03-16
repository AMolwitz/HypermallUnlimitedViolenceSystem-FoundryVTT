import { prepareActiveEffectCategories } from "../../helpers/effects.mjs";
import { getCompatibleTextEditor } from "../../utils/compatibility.mjs";
import { HypermallActor } from "./actor-sheet.mjs";

export class HypermallNPCSheet extends HypermallActor {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hypermall", "sheet", "actor"],
      template: "systems/hypermalluv/templates/actor/npc-sheet.html",
      width: 1100,
      height: 475,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  /** @override */
  async getData() {
    const context = super.getData();

    const applyNpcSheetDefaults = (systemData) => {
      systemData.meat ??= { value: 2, max: 6 };
      systemData.stress ??= { value: 2, max: 6 };
      systemData.debt ??= { value: 0, max: 6 };
      systemData.phrenology ??= { active: "", one: "", two: "", three: "", four: "", five: "", six: "" };
      systemData.moves ??= [""];
      systemData.damage ??= "";
    };

    applyNpcSheetDefaults(context.system);
    applyNpcSheetDefaults(context.sourceSystem);

    // Initialize meat, stress, debt if they don't exist
    // Check if debt value is negative for conditional styling
    context.debtIsNegative = context.system.debt.value < 0;
    
    // Calculate Loan Default (next highest multiple if over max)
    const debtValue = context.system.debt.value;
    const debtMax = context.system.debt.max;
    context.showLoanDefault = debtValue > debtMax;
    if (debtValue > debtMax && debtMax > 0) {
      context.LoanDefault = Math.ceil(debtValue / debtMax) * debtMax;
    } else {
      context.LoanDefault = debtMax;
    }
    
    const textEditor = getCompatibleTextEditor()

    context.enrichedBackground = await textEditor.enrichHTML(context.sourceSystem.background || "")
    context.enrichedPsionics = await textEditor.enrichHTML(context.sourceSystem.psionics || "")
    context.enrichedMutations = await textEditor.enrichHTML(context.sourceSystem.mutations || "")
    context.enrichedQuote = await textEditor.enrichHTML(context.sourceSystem.quote || "")
    context.enrichedGear = await textEditor.enrichHTML(context.sourceSystem.allGear || "")
    context.enrichedPhrenology = await textEditor.enrichHTML(Object.values(context.sourceSystem.phrenology).join("\n"))

    context.editable = this.isEditable;

    // Prepare character data and items.
    if (this.actor.type == 'contractor') {
      await this._prepareItems(context);
      // this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (this.actor.type == 'npc') {
      await this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.HYPERMALL.abilities[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const effects = [];
    const mutations = [];
    const psionics = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Add defensive check for description
      i.enrichedDescription = await TextEditor.enrichHTML(i.system?.description || "");
      
      // Categorize by item type
      if (i.type === 'gear') {
        gear.push(i);
      } else if (i.type === 'effect') {
        effects.push(i);
      } else if (i.type === 'mutation') {
        mutations.push(i);
      } else if (i.type === 'psionic') {
        psionics.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.effects = effects;
    context.effectItems = effects;
    context.mutations = mutations;
    context.psionics = psionics;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if (!this.isEditable) return;

    // Persist resource inputs immediately
    html.find('.hypermall-meat-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorMeat = this.actor.system.meat;
      this.validateThresholdChange(eventValue, event.target, actorMeat, actorMeat.min);
    });
    html.find('.hypermall-stress-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorStress = this.actor.system.stress;
      this.validateThresholdChange(eventValue, event.target, actorStress, actorStress.min);
    });
    html.find('.hypermall-debt-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorDebt = this.actor.system.debt;
      this.validateThresholdChange(eventValue, event.target, actorDebt, null, Infinity);
    });
    html.find('.hypermall-resurrection').click(this._onResurrection.bind(this));
    html.find('.hypermall-stress-break').click(this._onStressBreak.bind(this));
    html.find('.hypermall-loan-default').click(this._onStressBreak.bind(this));

    // Meat damage modifier increment/decrement buttons
    html.find('.hypermall-meat-modifier-increment').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-roll-meat-modifier');
      const currentValue = parseInt(input.val()) || 1;
      input.val(Math.min(currentValue + 1, 3));
    });
    html.find('.hypermall-meat-modifier-decrement').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-roll-meat-modifier');
      const currentValue = parseInt(input.val()) || 1;
      input.val(Math.max(currentValue - 1, 1));
    });

    // Psionic roller
    html.find('#hypermall-psionics-roller').click(this._onRoll.bind(this));

    // Damage roller
    html.find('#hypermall-damage-roller').click(this._onRoll.bind(this));

    // Damage dice increment/decrement buttons
    html.find('.hypermall-damage-dice-increment').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-damage-dice');
      const currentValue = parseInt(input.val()) || 1;
      input.val(Math.max(currentValue + 1, 1));
    });
    html.find('.hypermall-damage-dice-decrement').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-damage-dice');
      const currentValue = parseInt(input.val()) || 1;
      input.val(Math.max(currentValue - 1, 1));
    });

    // Damage modifier increment/decrement buttons
    html.find('.hypermall-damage-modifier-increment').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-damage-modifier');
      const currentValue = parseInt(input.val()) || 0;
      input.val(currentValue + 1);
    });
    html.find('.hypermall-damage-modifier-decrement').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-damage-modifier');
      const currentValue = parseInt(input.val()) || 0;
      input.val(currentValue - 1);
    });

    // Handle adding moves
    html.find('.add-move').click(async (event) => {
      event.preventDefault();
      const moves = this.actor.system.moves || [];
      if (moves.length < 6) {
        await this.actor.update({ 'system.moves': [...moves, ''] });
      }
    });

    // Handle removing moves
    html.find('.remove-move').click(async (event) => {
      event.preventDefault();
      const moves = this.actor.system.moves || [];
      if (moves.length > 1) {
        const index = $(event.currentTarget).closest('.move-input-group').data('index');
        const newMoves = moves.filter((_, i) => i !== index);
        await this.actor.update({ 'system.moves': newMoves });
      }
    });

    // Handle move input blur to ensure persistence
    html.find('.move-input').blur(async (event) => {
      await this.submit({ preventClose: true, preventRender: false });
    });

    // Handle phrenology cell click to select/highlight
    html.find('.phrenology-cell').click(async (event) => {
      const cell = $(event.currentTarget);
      const key = cell.data('phen-key');
      
      // Remove active class from all cells
      html.find('.phrenology-cell').removeClass('phrenology-active');
      
      // Add active class to clicked cell
      cell.addClass('phrenology-active');
      
      // Update the actor data
      await this.actor.update({ 'system.phrenology.active': key });
    });

    // Handle phrenology text input blur to ensure persistence
    html.find('.phrenology-cell input[type="text"]').blur(async (event) => {
      await this.submit({ preventClose: true, preventRender: false });
    });

    // Gear management
    html.find('.gear-create').click(this._onCreateGear.bind(this));
    html.find('.effect-create').click(this._onCreateEffect.bind(this));
    html.find('.effect-delete-all').click(this._onDeleteAllEffects.bind(this));

    html.on('click', '.gear-edit', this._onItemEdit.bind(this));
    html.on('click', '.gear-delete', this._onItemDelete.bind(this));
    html.on('change', '.gear-carry-type', this._onChangeCarryType.bind(this));
    html.on('click', '.effect-edit', this._onItemEdit.bind(this));
    html.on('click', '.effect-delete', this._onItemDelete.bind(this));

    html.find('.hypermall-hit-location').click(this._onRollHitLocation.bind(this));

    // --- Drag-and-Drop Hover Feedback ---
    const dropZones = html.find('[data-drop-type]');

    dropZones.on('dragenter', (event) => {
      // Prevent the event from bubbling up and causing other handlers to fire.
      event.stopPropagation();
      $(event.currentTarget).addClass('hypermall-drop-hover');
    });

    dropZones.on('dragleave', (event) => {
      // This check prevents the style from flickering when moving over child elements.
      if (!event.currentTarget.contains(event.relatedTarget)) {
        $(event.currentTarget).removeClass('hypermall-drop-hover');
      }
    });

    // Also remove the class when an item is dropped, as dragleave doesn't always fire.
    dropZones.on('drop', (event) => {
      $(event.currentTarget).removeClass('hypermall-drop-hover');
    });
  }


  async validateThresholdChange(eventValue, eventTarget, actorValue, minimum = 0, maximum = null) {
    try {
      // If actorValue schema is missing, keep the input as-is but don't attempt to persist.
      if (!actorValue) return;

      // NaN -> revert to current actor value
      if (isNaN(eventValue)) {
        eventTarget.value = actorValue.value ?? 0;
        return;
      }

      const min = minimum !== null ? Number(minimum) : Number(actorValue.min ?? -Infinity);
      const max = maximum !== null ? Number(maximum) : Number(actorValue.max ?? eventValue);
      const clamped = Math.max(min, Math.min(max, eventValue));

      // Update the displayed value if it was adjusted
      if (String(eventTarget.value) !== String(clamped)) eventTarget.value = clamped;

      // Persist to the actor if it actually changed
      const current = Number(actorValue.value ?? 0);
      if (current !== Number(clamped)) {
        const update = {};
        update[eventTarget.name] = Number(clamped);
        await this.actor.update(update);
      }
    } catch (err) {
      console.error("validateThresholdChange error:", err);
    }
  }

  async _onCreateGear(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Prepare the data for the new item using the modern data model.
    const itemData = {
      name: "New Gear",
      type: "gear",
    };

    // Create the item directly on the actor.
    return Item.create(itemData, { parent: this.actor });
  }

  async _onCreateEffect(event) {
    event.preventDefault();
    const itemData = {
      name: "New Effect",
      type: "effect",
    };

    return Item.create(itemData, { parent: this.actor });
  }

  /**
 * Handle dropping an Item data object onto the Actor Sheet.
 * @param {DragEvent} event   The concluding DragEvent which contains drop data
 * @param {object} data       The data object extracted from the event
 * @returns {Promise<Item[]|boolean>}
 * @override
 */
  async _onDropItem(event, data) {
    if (!this.isEditable) return false;

    const dropContainer = event.target.closest("[data-drop-type]");
    if (!dropContainer) return super._onDropItem(event, data);

    const dropType = dropContainer.dataset.dropType;

    if (!["gear", "effect", "mutation", "psionic", "background"].includes(dropType)) return false;

    const item = await Item.fromDropData(data);
    if (!item) return false;

    if (item.type !== dropType) {
      ui.notifications.warn(`Only ${dropType} items can be added to this area.`);
      return false;
    }

    const itemData = item.toObject();
    const createdItems = await this.actor.createEmbeddedDocuments("Item", [itemData]);

    if (dropType === "gear" && createdItems.length) {
      await this._syncLinkedEffectsForGear(createdItems[0]);
    }

    return createdItems;
  }

  async _onChangeCarryType(event) {
    event.preventDefault();
    event.stopPropagation();

    const select = event.target?.closest?.("select.gear-carry-type");
    if (!select) return;

    const itemId = select.dataset.itemId ?? select.closest(".item")?.dataset.itemId;
    if (!itemId) return;

    const carryType = String(select.value ?? "").trim();
    if (!carryType.length) return;

    const [updatedGear] = await this.actor.updateEmbeddedDocuments("Item", [{
      _id: itemId,
      "system.carryType": carryType
    }]);

    await this._syncLinkedEffectsForGear(updatedGear ?? this.actor.items.get(itemId));
  }

  _onItemEdit(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    item.sheet.render(true);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    // Display a confirmation dialog for better UX.
    const confirmed = await Dialog.confirm({
      title: game.i18n.format("HYPERMALL.DeleteConfirmTitle", { name: item.name }),
      content: `<p>${game.i18n.format("HYPERMALL.DeleteConfirmContent", { name: item.name })}</p>`,
      options: { classes: ["hypermall", "dialog", "hypermall-theme"] }
    });

    if (confirmed) {
      return this._deleteItemAndLinkedEffects(item);
    }
  }

  async _onDeleteAllEffects(event) {
    event.preventDefault();

    const effectIds = this.actor.items
      .filter((item) => item.type === "effect")
      .map((item) => item.id);

    if (!effectIds.length) {
      ui.notifications.info("No effects to delete.");
      return;
    }

    const confirmed = await Dialog.confirm({
      title: "Delete All Effects?",
      content: `<p>This will permanently delete ${effectIds.length} effect(s) from ${this.actor.name}.</p>`,
      options: { classes: ["hypermall", "dialog", "hypermall-theme"] }
    });

    if (!confirmed) return;

    await this.actor.deleteEmbeddedDocuments("Item", effectIds);
  }

  /** @inheritDoc */
  async activateEditor(name, options = {}, initialContent = "") {
    options.engine = "prosemirror"
    options.relativeLinks = true;
    options.plugins = {
      menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
        compact: true,
        destroyOnSave: false,
        onSave: () => this.saveEditor(name, { remove: false })
      })
    };
    return super.activateEditor(name, options, initialContent);
  }

  async _onRoll(event) {
    event.preventDefault();
    const triggeringElement = event.currentTarget;

    if (triggeringElement.id === 'hypermall-psionics-roller') {
      let meatModifier = parseInt(this.getMeatModifierFromSheet(triggeringElement));
      let thinkitudeDiePool = this.actor.system.abilities?.thinkitude?.value ?? 0;
      let psiDiePool = thinkitudeDiePool + meatModifier;
      let psiRollString = this.generateRollString(psiDiePool);

      let psiRoll = await new Roll(psiRollString).evaluate();
      if (psiDiePool < 0) {
        psiRoll._formula = `${1}d6cs>=5`;
      }

      await this.sendPsionicRollResults(psiRoll, psiDiePool, meatModifier);
      
      // Add meat damage modifier to meat.value
      const currentMeat = this.actor.system.meat.value;
      const meatMax = this.actor.system.meat.max;
      const newMeatValue = currentMeat + meatModifier;
      
      // Check for thresholds and post warnings
      let finalMeatValue = newMeatValue;
      if (newMeatValue >= meatMax) {
        if (newMeatValue === meatMax) {
          // Suicide by Psionics: apply damage normally
          const content = '<div style="color: red; font-weight: bold;">Suicide by Psionics</div>';
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: content
          });
        } else {
          // Insufficient Meat: do not update meat value
          finalMeatValue = currentMeat;
          const content = '<div style="color: orange; font-weight: bold;">Insufficient Meat</div>';
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: content
          });
        }
      }
      
      await this.actor.update({ 'system.meat.value': finalMeatValue });
    } else if (triggeringElement.id === 'hypermall-damage-roller') {
      let damageDice = parseInt(this.element.find('#hypermall-damage-dice').val()) || 1;
      let damageModifier = parseInt(this.element.find('#hypermall-damage-modifier').val()) || 0;
      
      let damageRollString = `${damageDice}d6`;
      if (damageModifier !== 0) {
        damageRollString += damageModifier > 0 ? ` + ${damageModifier}` : ` - ${Math.abs(damageModifier)}`;
      }
      
      let damageRoll = await new Roll(damageRollString).evaluate();
      await this.sendDamageRollResults(damageRoll, damageDice, damageModifier);
    }
  }

  generateRollString(Die_Pool) {
    if (Die_Pool > 0) return `${Math.abs(Die_Pool)}d6cs>=5`;
    return `${1}d6cs>=5`;
  }

  getMeatModifierFromSheet() {
    return this.element.find('#hypermall-roll-meat-modifier').val() ?? '';
  }

  async sendPsionicRollResults(roll, Die_Pool, meatModifier) {
    let flavor = '';
    if (Die_Pool < 0) {
      flavor += 'Rolled with negative die pool. The American Consumer Federation recommends against doing that.<br>';
    }
    flavor += `Rolled Psionics with a ${meatModifier} meat damage modifier.`

    const chatMessage = await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: flavor
    });
    return chatMessage;
  }

  async sendDamageRollResults(roll, damageDice, damageModifier) {
    let flavor = `Rolled ${damageDice}d6`;
    if (damageModifier !== 0) {
      flavor += damageModifier > 0 ? ` + ${damageModifier}` : ` - ${Math.abs(damageModifier)}`;
    }
    flavor += ' for damage.';

    const chatMessage = await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: flavor
    });
    return chatMessage;
  }

}
