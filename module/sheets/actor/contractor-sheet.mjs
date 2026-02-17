import { prepareActiveEffectCategories } from "../../helpers/effects.mjs";
import { getCompatibleTextEditor } from "../../utils/compatibility.mjs";
import { HypermallActor } from "./actor-sheet.mjs";

/**
 * Extends our base HypermallActor class to create a sheet for Contractors.
 * @extends {HypermallActor}
 */
export class HypermallContractorSheet extends HypermallActor {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hypermall", "sheet", "actor"],
      template: "systems/hypermalluv/templates/actor/contractor-sheet.html",
      width: 900,
      height: 675,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "competencies" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    context.sheetSettings = {};
    context.sheetSettings.isLimited = this.actor.permission == CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
    context.sheetSettings.isObserver = (this.actor.permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER || this.actor.compendium?.locked);

    context.iclDropdown = {
      0: "HyperMall Group Hogs",
      1: "Musashi Heavy Industries Manticores",
      2: "Warpath LLC Geldings",
      3: "Patriot Defense Systems",
      4: "FIGHTIN' IRISH",
      5: "Rotterdam HOUNDS (\"The Rotties\")",
      6: "Welland Jackfish"
    }
    context.fanLevelDropdown = {
      0: "I'll buy a ticket if it's on sale.",
      1: "I stream most of their playoff games.",
      2: "I own a few pieces of merch",
      3: "I'm really more into the fantasy aspect wait where are you going.",
      4: "I'm subscribed to dozens of podcasts about my team.",
      5: "I have killed for my team and will do so again."
    }
    context.handednessDropdown = {
      0: "Left-handed",
      1: "Right-handed",
      2: "Ambidexterous"
    }
    context.temperamentDropdown = {
      0: "Sanguine",
      1: "Melancholic",
      2: "Lethargic",
      3: "Phlegmatic"
    }

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access.
    context.system = actorData.system;

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

    // Calculate power uses max: highest of 1, meditation*2, or worship*2
    const meditationSkill = context.system.skills?.meditation?.value ?? 0;
    const worshipSkill = context.system.skills?.worship?.value ?? 0;
    const calculatedPowerUsesMax = Math.max(1, meditationSkill * 2, worshipSkill * 2);
    
    // Update the actor's powerUses.max if it differs from calculated value
    if (context.system.powerUses && context.system.powerUses.max !== calculatedPowerUsesMax) {
      await this.actor.update({ 'system.powerUses.max': calculatedPowerUsesMax });
      context.system.powerUses.max = calculatedPowerUsesMax;
    }

    const textEditor = getCompatibleTextEditor()

    context.enrichedBackground = await textEditor.enrichHTML(context.system.background || "")
    context.enrichedMutations = await textEditor.enrichHTML(context.system.mutations || "")
    context.enrichedGear = await textEditor.enrichHTML(context.system.allGear || "")
    context.enrichedPassions = await textEditor.enrichHTML(context.system.passions || "")
    context.enrichedSpecial = await textEditor.enrichHTML(context.system.special || "")
    context.enrichedPsionics = await textEditor.enrichHTML(context.system.psionics || "")
    
    context.editable = this.isEditable;

    // Prepare character data and items.
    if (actorData.type == 'contractor') {
      await this._prepareItems(context);
      // this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      await this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Ensure actor is present in context for templates
    if (!context.actor) {
      context.actor = this.actor;
    }

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
    const mutations = [];
    const psionics = [];
    const backgrounds = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      i.enrichedDescription = await TextEditor.enrichHTML(i.system.description || "");
      
      // Categorize by item type
      if (i.type === 'gear') {
        gear.push(i);
      } else if (i.type === 'mutation') {
        mutations.push(i);
      } else if (i.type === 'psionic') {
        psionics.push(i);
      } else if (i.type === 'background') {
        backgrounds.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.mutations = mutations;
    context.psionics = psionics;
    context.backgrounds = backgrounds;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Ensure dropdowns reflect current values
    const handedSelect = html.find('select[name="system.handedness"]');
    if (handedSelect.length) handedSelect.val(this.actor.system?.handedness ?? "");

    const fanLevelSelect = html.find('select[name="system.fanLevel"]');
    if (fanLevelSelect.length) fanLevelSelect.val(this.actor.system?.fanLevel ?? "");

    const temperamentSelect = html.find('select[name="system.temperament"]');
    if (temperamentSelect.length) temperamentSelect.val(this.actor.system?.temperament ?? "");

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    const tabs = html.find('.sheet-tabs .item');
    tabs.on('click', (event) => {
      this._setSheetHeight($(event.currentTarget).data('tab'));
    });
    // Set initial height based on the active tab.
    this._setSheetHeight(tabs.filter('.active').data('tab'));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

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

    // Passion modifier increment/decrement buttons
    html.find('.hypermall-passion-increment').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-roll-passions');
      const currentValue = parseInt(input.val()) || 0;
      input.val(currentValue + 1);
    });
    html.find('.hypermall-passion-decrement').click((event) => {
      event.preventDefault();
      const input = this.element.find('#hypermall-roll-passions');
      const currentValue = parseInt(input.val()) || 0;
      input.val(currentValue - 1);
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

    //Hypermall-Specific Listeners
    html.find('.hypermall-rolling-atribute').change((event) => {
      let attributeElement = event.delegateTarget;
      this.checkAttributeValue(attributeElement);
    });
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
    html.find('.hypermall-power-uses-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorPowerUses = this.actor.system.powerUses;
      this.validateThresholdChange(eventValue, event.target, actorPowerUses, actorPowerUses.min);
    });
    html.find('.hypermall-debt-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorDebt = this.actor.system.debt;
      this.validateThresholdChange(eventValue, event.target, actorDebt, null, Infinity);
    });
    html.find('.hypermall-hit-location').click(this._onRollHitLocation.bind(this));
    html.find('.hypermall-dodge-roll').click(this._onRollDodge.bind(this));
    html.find('.hypermall-gorge-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorGorge = this.actor.system.derived?.gorge;
      this.validateThresholdChange(eventValue, event.target, actorGorge, actorMeat.min);
    });

    // Gear management
    html.find('.gear-create').click(this._onCreateGear.bind(this));

    html.on('click', '.gear-edit', this._onItemEdit.bind(this));
    html.on('click', '.gear-delete', this._onItemDelete.bind(this));

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

  /**
  * Adjusts the sheet height based on the selected tab.
  * @param {string} tabName The 'data-tab' attribute of the selected tab.
  * @private
  */
  _setSheetHeight(tabName) {
    const defaultHeight = this.constructor.defaultOptions.height;
    const currentHeight = this.position.height;

      // If the sheet isn't already the default height, resize it.
      if (currentHeight !== defaultHeight) {
        this.setPosition({ height: defaultHeight });
      }
    
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

    // Find the drop container to determine what kind of item is being added.
    const dropContainer = event.target.closest("[data-drop-type]");
    if (!dropContainer) return super._onDropItem(event, data);

    const dropType = dropContainer.dataset.dropType;

    // Validate that the drop type is one we handle.
    if (!["gear", "mutation", "psionic", "background"].includes(dropType)) return false;

    const item = await Item.fromDropData(data);
    if (!item) return false;

    // Validate that the dropped document type matches the drop zone.
    if (item.type !== dropType) {
      ui.notifications.warn(`Only ${dropType} items can be added to this area.`);
      return false;
    }

    // Prepare the item data.
    const itemData = item.toObject();

    // Create the new item on the actor.
    return this.actor.createEmbeddedDocuments("Item", [itemData]);
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
      return item.delete();
    }
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

  
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const triggeringElement = event.currentTarget;

    switch (triggeringElement.id) {
      case 'hypermall-character-roller':
        //const stressLevel = this.actor.system.stress.value;
        //let meatLevel = this.actor.system.meat.value;
        //let debtLevel = this.actor.system.debt.value;
        let passionsModifier = parseInt(this.getPassionsModifierFromSheet(triggeringElement));

        let Die_Pool = this.calculateDiePool(triggeringElement) + passionsModifier;
        let rollString = this.generateRollString(Die_Pool);

        let roll = await new Roll(rollString).evaluate();
        // Simplified the displayed formula to reduce confusion.
        if (Die_Pool < 0) {
          roll._formula = `${1}d6cs>=5`;
        }

        await this.sendRollResults(roll, Die_Pool, passionsModifier);
        break;
      case 'hypermall-psionics-roller':
        // Check if power uses are available
        const currentPowerUses = this.actor.system.powerUses.value;
        if (currentPowerUses <= 0) {
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: '<div style="color: red; font-weight: bold;">No power uses remaining</div>'
          });
          break;
        }

        let meatModifier = parseInt(this.getMeatModifierFromSheet(triggeringElement));
        let thinkitudeDiePool = this.actor.system.abilities.thinkitude.value;
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
        
        // Reduce power uses by 1
        const newPowerUses = currentPowerUses - 1;
        
        await this.actor.update({ 
          'system.meat.value': finalMeatValue,
          'system.powerUses.value': newPowerUses
        });
        break;
      case 'hypermall-damage-roller':
        let damageDice = parseInt(this.element.find('#hypermall-damage-dice').val()) || 1;
        let damageModifier = parseInt(this.element.find('#hypermall-damage-modifier').val()) || 0;
        
        let damageRollString = `${damageDice}d6`;
        if (damageModifier !== 0) {
          damageRollString += damageModifier > 0 ? ` + ${damageModifier}` : ` - ${Math.abs(damageModifier)}`;
        }
        
        let damageRoll = await new Roll(damageRollString).evaluate();
        await this.sendDamageRollResults(damageRoll, damageDice, damageModifier);
        break;
    }

  }


  generateRollString(Die_Pool) {
    if (Die_Pool > 0) return `${Math.abs(Die_Pool)}d6cs>=5`;
    return `${1}d6cs>=5`;
  }

  async sendRollResults(roll, Die_Pool, passionsModifier) {
    let flavor = '';
    if (Die_Pool < 0) {
      flavor += 'Rolled with negative die pool. The American Consumer Federation recommends against doing that.<br>';
    }
    flavor += `Rolled with a ${passionsModifier} passion modifier.`

    const message = await roll.toMessage({ flavor, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
    console.log(message);
  }

  async _onRollDodge(event) {
    event.preventDefault();

    const dodgeValue = this.actor.system.derived.dodge.value;
    const rollString = this.generateRollString(dodgeValue);
    const roll = await new Roll(rollString).evaluate();
    
    if (dodgeValue < 0) {
      roll._formula = `${1}d6cs>=5`;
    }

    const flavor = `Dodge Roll (${dodgeValue} dice)`;
    await roll.toMessage({ 
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: flavor 
    });
  }

  calculateDiePool() {
    const rollData = this.actor.getRollData();

    let Die_Pool = parseInt(this.getStatisticsDiePoolFromSheet(rollData));

    return Die_Pool;
  }

  getStatisticsDiePoolFromSheet(rollData) {
    // Read selectors by id
    const statSel = this.element.find('#hypermall-roll-stat').val() ?? '';
    const skillSel = this.element.find('#hypermall-roll-skill').val() ?? '';

    const stat = (String(statSel) || '').toLowerCase();
    const skill = (String(skillSel) || '').toLowerCase();

    const statDiePool = parseInt(rollData.abilities?.[stat]?.value ?? 0);
    let skillDiePool = parseInt(rollData.skills?.[skill]?.value ?? 0);

    // Prefer top-level system.skills if available
    if (rollData.skills && rollData.skills[skill] !== undefined) {
      skillDiePool = Number(rollData.skills[skill].value ?? rollData.skills[skill] ?? 0);
    } else {
      // Fallback: search ability-level skills
      for (const ability of Object.values(rollData.abilities ?? {})) {
        if (ability?.skills && ability.skills[skill] !== undefined) {
          skillDiePool = Number(ability.skills[skill].value ?? 0);
          break;
        }
      }
    }

    return statDiePool + skillDiePool;
  }

  getPassionsModifierFromSheet() {
    return this.element.find('#hypermall-roll-passions').val() ?? '';
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

  checkAttributeValue(sender) {
    const min = 0
    let value = parseInt(sender.value);
    if (isNaN(value)) {
      sender.value = 0;
    }
    else if (value < min) {
      sender.value = min;
    }
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

}

