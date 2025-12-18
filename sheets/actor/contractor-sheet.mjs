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
      template: "systems/hypermall/templates/actor/contractor-sheet.html",
      width: 900,
      height: 675,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
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
      0: "Lefthanded",
      1: "Righthanded",
      2: "Ambidexterous"
    }

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    const textEditor = getCompatibleTextEditor()

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
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

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
    const naughtyHeight = 900;
    const currentHeight = this.position.height;
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
    if (!["gear"].includes(dropType)) return false;

    const item = await Item.fromDropData(data);
    if (!item) return false;

    // Validate that the dropped document is an 'equipment' item.
    if (item.type !== "gear") {
      ui.notifications.warn("Only gear items can be added to this sheet.");
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
        let passionsModifier = parseInt(this.getPassionsModifierFromSheet(triggeringElement));

        let dicePool = this.calculateDicePool(triggeringElement, passionsModifier);
        let rollString = this.generateRollString(dicePool);

        let roll = await new Roll(rollString).evaluate();

        await this.sendRollResults(roll, dicePool, passionsModifier);
        break;
    }

  }


  generateRollString(dicePool) {
    return `${dicePool}d6cs>=5)`;
  }

  async sendRollResults(roll, dicePool, passionsModifier) {

    const message = await roll.toMessage({ flavor, speaker: ChatMessage.getSpeaker({ actor: this.actor }) });
    console.log(message);
  }

  calculateDicePool(triggeringElement, passionsModifier) {
    const rollData = this.actor.getRollData();

    let dicePool = parseInt(this.getStatisticsDicePoolFromSheet(triggeringElement, rollData));

    dicePool += passionsModifier;
  }

  getStatisticsDicePoolFromSheet(htmlElement, rollData) {
    let stat = htmlElement.form[26].value.toLowerCase()
    let skill = htmlElement.form[27].value
    let statPool = parseInt(rollData.abilities[stat].value);
    let skillPool;

    Object.values(rollData.abilities).forEach(ability => {

      if (ability.hasOwnProperty('skills') && ability.skills.hasOwnProperty(skill)) {
        skillPool = parseInt(ability.skills[skill].value);
      }
    });

    return statPool + skillPool;
  }

  getPassionsModifierFromSheet(htmlElement) {
    return htmlElement.form[28].value;
  }

  getInitiativeModifierFromSheet(htmlElement) {
    return htmlElement.form[29].value;
  }

  checkAttributeValue(sender) {
    let value = parseInt(sender.value);
    if (isNaN(value)) {
      sender.value = 0;
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
