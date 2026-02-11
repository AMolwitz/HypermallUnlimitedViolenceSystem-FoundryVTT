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

    const actorData = this.actor.toObject(false);

    // Initialize meat, stress, debt if they don't exist
    if (actorData.system.meat == undefined) {
      actorData.system.meat = {};
      actorData.system.meat.value = 2;
      actorData.system.meat.max = 6;
    }

    if (actorData.system.stress == undefined) {
      actorData.system.stress = {};
      actorData.system.stress.value = 2;
      actorData.system.stress.max = 6;
    }

    if (actorData.system.debt == undefined) {
      actorData.system.debt = {};
      actorData.system.debt.value = 0;
      actorData.system.debt.max = 6;
    }

    context.system = actorData.system;
    
    const textEditor = getCompatibleTextEditor()

    context.enrichedBackground = await textEditor.enrichHTML(context.system.background)
    context.enrichedPsionics = await textEditor.enrichHTML(context.system.psionics)
    context.enrichedMutations = await textEditor.enrichHTML(context.system.mutations)
    context.enrichedQuote = await textEditor.enrichHTML(context.system.quote)
    context.enrichedGear = await textEditor.enrichHTML(context.system.allGear)
    context.enrichedPhrenology = await textEditor.enrichHTML(Object.values(context.system.phrenology).join("\n"))

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

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Add defensive check for description
      i.enrichedDescription = await TextEditor.enrichHTML(i.system?.description || "");
      
      // Categorize by item type
      if (i.type === 'gear') {
        gear.push(i);
      } else if (i.type === 'mutation') {
        mutations.push(i);
      } else if (i.type === 'psionic') {
        psionics.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
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


  async validateThresholdChange(eventValue, eventTarget, actorValue) {
    try {
      // If actorValue schema is missing, keep the input as-is but don't attempt to persist.
      if (!actorValue) return;

      // NaN -> revert to current actor value
      if (isNaN(eventValue)) {
        eventTarget.value = actorValue.value ?? 0;
        return;
      }

      const min = Number(actorValue.min ?? 0);
      const max = Number(actorValue.max ?? eventValue);
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
      name: "New Equipment",
      type: "gear",
    };

    // Create the item directly on the actor.
    return Item.create(itemData, { parent: this.actor });
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

}
