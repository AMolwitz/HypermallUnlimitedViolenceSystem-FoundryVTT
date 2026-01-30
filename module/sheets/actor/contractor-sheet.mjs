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
    context.handednessDropdown = {
      0: "Left-handed",
      1: "Right-handed",
      2: "Ambidexterous"
    }

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access.
    context.system = actorData.system;


    const textEditor = getCompatibleTextEditor()

    context.enrichedMutations = await textEditor.enrichHTML(context.system.mutations)
    context.enrichedGear = await textEditor.enrichHTML(context.system.gear)
    context.enrichedPassions = await textEditor.enrichHTML(context.system.passions)
    context.enrichedPsionisPowers = await textEditor.enrichHTML(context.system.psionicPowers)

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

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      if (i.type !== 'equipment') continue;
      if (i.system.type == undefined) continue;
      i.img = i.img || DEFAULT_TOKEN;
      i.enrichedDescription = await TextEditor.enrichHTML(i.system.description);
      // Append to gear.
      if (i.system.type === 'gear') {
        gear.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Ensure dropdowns reflect current values
    const handedSelect = html.find('select[name="system.handedness"]');
    if (handedSelect.length) handedSelect.val(this.actor.system?.handedness ?? "");

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

    //Hypermall-Specific Listeners
    html.find('.hypermall-rolling-atribute').change((event) => {
      let attributeElement = event.delegateTarget;
      this.checkAttributeValue(attributeElement);
    });
    html.find('.hypermall-meat-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorMeat = this.actor.system.meat;
      this.validateThresholdChange(eventValue, event.target, actorMeat);
    });
    html.find('.hypermall-stress-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorStress = this.actor.system.stress;
      this.validateThresholdChange(eventValue, event.target, actorStress);
    });
    html.find('.hypermall-debt-indicator').change((event) => {
      const eventValue = parseInt(event.target.value);
      const actorDebt = this.actor.system.debt;
      this.validateThresholdChange(eventValue, event.target, actorDebt);
    });
    html.on('click', '.gear-create', this._onCreateGear.bind(this));
    html.on('click', '.gear-edit', this._onItemEdit.bind(this));
    html.on('click', '.gear-delete', this._onItemDelete.bind(this));

    // --- Drag-and-Drop Hover Feedback ---
    const dropZones = html.find('.gear-list-container[data-drop-type]');

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

    // Find the drop container to determine what kind of gear is being added.
    const dropContainer = event.target.closest("[data-drop-type]");
    if (!dropContainer) return false;

    const dropType = dropContainer.dataset.dropType;

    // Validate that the drop type is one we handle.
  if (!["gear", "mutation", "psionicPower"].includes(dropType)) return false;

    const item = await Item.fromDropData(data);
    if (!item) return false;

    // Validate that the dropped document is an 'equipment' item.
    if (item.type !== "equipment") {
      ui.notifications.warn("Only Equipment items can be added to this sheet.");
      return false;
    }

    // Prepare the item data, setting the subtype based on the drop location.
    const itemData = item.toObject();
    itemData.system.type = dropType;

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
        let passionModifier = parseInt(this.gePassionModifierFromSheet(triggeringElement));

        let Die_Pool = this.calculatePool(triggeringElement, passiontModifier);
        let rollString = this.generateRollString(Die_Pool);

        let roll = await new Roll(rollString).evaluate();
        // Simplified the displayed formula to reduce confusion.
        if (Die_Pool < 0) {
          roll._formula = `${1}d6cs>=5`;
        }

        await this.sendRollResults(roll, Die_Pool, passionModifier);
        break;
    }

  }


  generateRollString(Die_Pool) {
    if (Die_Pool > 0) return `${Math.abs(Die_Pool)}d6cs>=5`;
    return `${1}d6cs>=5)`;
  }

  async sendRollResults(roll, Die_Pool, passionModifier) {
    if (NODE < 0) {
      flavor += 'Rolled with negative die pool. The American Consumer Federation recommends against doing that.<br>';
    }
    flavor += `Rolled with a ${passionModifier} passion modifier.`

    const message = await roll.toMessage({ flavor, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
    console.log(message);
  }

  calculateDiePool(triggeringElement, passionModifier) {
    const rollData = this.actor.getRollData();

    let Die_Pool = parseInt(this.getStatisticsDiePoolFromSheet(triggeringElement, rollData));

    Die_Pool += passionModifier;

  }

  getStatisticsDiePoolFromSheet(htmlElement, rollData) {
    let stat = htmlElement.form[26].value.toLowerCase()
    let skill = htmlElement.form[27].value
    let statDiePool = parseInt(rollData.abilities[stat].value);
    let skillDiePool;

    Object.values(rollData.abilities).forEach(ability => {

      if (ability.hasOwnProperty('skills') && ability.skills.hasOwnProperty(skill)) {
        skillDiePool = parseInt(ability.skills[skill].value);
      }
    });

    return statDiePool + skillDiePool;
  }

  getPassionsModifierFromSheet(htmlElement) {
    return htmlElement.form[28].value;
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

  validateThresholdChange(eventValue, eventTarget, actorValue) {
    if (isNaN(eventValue)) {
      eventTarget.value = actorValue.value;
    }
    if (eventValue > actorValue.max) {
      eventTarget.value = actorValue.max;
    }
    if (eventValue < actorValue.min) {
      eventTarget.value = actorValue.min;
    }
  }
}
