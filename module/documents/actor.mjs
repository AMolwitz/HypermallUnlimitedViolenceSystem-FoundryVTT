/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class HypermallActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    this._applyEffectRules({ includeDerivedPaths: false });

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);

    this._applyEffectRules({ includeDerivedPaths: true });
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (this.type !== 'contractor') return;
    
    const systemData = actorData.system;
    // Calculate gorge.max based on physick
    if (systemData.derived && systemData.abilities?.physick) {
      systemData.derived.gorge.max = systemData.abilities.physick.value;
    }
    
    // Calculate dodge.value based on savvy*2
    if (systemData.derived && systemData.abilities?.savvy) {
      systemData.derived.dodge.value = systemData.abilities.savvy.value * 2;
    }

    if (systemData.powerUses) {
      const meditationSkill = systemData.skills?.meditation?.value ?? 0;
      const worshipSkill = systemData.skills?.worship?.value ?? 0;
      const psiPowerBonus = Number(systemData.psiPower ?? 0);
      const basePowerUsesMax = Math.max(1, meditationSkill * 2, worshipSkill * 2);
      systemData.powerUses.max = Math.max(1, basePowerUsesMax + psiPowerBonus);
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) { }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'contractor') return;

    data.psiPower = Number(data.psiPower ?? data.system?.psiPower ?? 0);

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `/roll @brainsd6`.
    if (data.abilities) {

      for (let [abilityName, ability] of Object.entries(data.abilities)) {
        let shorthand = this.getAbilityShorthand(abilityName);
        data[abilityName] = ability.value ?? 0;
        if (shorthand !== '') {
          data[shorthand] = ability.value ?? 0;
        }
        for (let [skillName, skill] of Object.entries(ability.skills ?? {})) {
          let sanitizedName = skillName.replace(/\s+/g, '').toLowerCase();
          data[sanitizedName] = skill?.value ?? 0;
        }
      }
    }
  }

  /**
   * Apply all dropped effect-item rules to transient actor data.
   * This mirrors PF2E's rule-element lifecycle: effects modify prepared data
   * instead of persisting source changes when the item is dropped.
   * @param {object} options
   * @param {boolean} options.includeDerivedPaths Apply only rules targeting
   * derived data when true, otherwise apply non-derived paths.
   */
  _applyEffectRules({ includeDerivedPaths = false } = {}) {
    const effectItems = this.items.filter((item) => item.type === "effect" && Array.isArray(item.system?.rules));

    for (const effectItem of effectItems) {
      for (const rule of effectItem.system.rules) {
        const path = typeof rule?.path === "string" ? rule.path.trim() : "";
        if (!path) continue;
        if (!path.startsWith("system.")) continue;

        const targetsDerivedData = path.startsWith("system.derived.");
        if (targetsDerivedData !== includeDerivedPaths) continue;

        const relativePath = path.slice("system.".length);
        if (!relativePath.length) continue;

        try {
          const currentValue = foundry.utils.getProperty(this.system, relativePath);
          const resolvedValue = this._resolveEffectRuleValue(rule.value, effectItem);
          const nextValue = this._getAppliedEffectValue({
            currentValue,
            operation: rule.operation,
            value: resolvedValue,
          });

          foundry.utils.setProperty(this.system, relativePath, nextValue);
        } catch (err) {
          console.error(`Error applying effect rule from "${effectItem.name}":`, err);
        }
      }
    }
  }

  _resolveEffectRuleValue(rawValue, effectItem) {
    if (typeof rawValue !== "string") return rawValue;

    const trimmedValue = rawValue.trim();
    if (!trimmedValue.length) return "";

    if ((trimmedValue.startsWith("{") && trimmedValue.endsWith("}"))
      || (trimmedValue.startsWith("[") && trimmedValue.endsWith("]"))) {
      try {
        return JSON.parse(trimmedValue);
      } catch (_error) {
        // Fall through to formula/string handling.
      }
    }

    if (!Number.isNaN(Number(trimmedValue))) {
      return Number(trimmedValue);
    }

    if (/[+\-*/()@]/.test(trimmedValue)) {
      const rollData = {
        actor: this.getRollData(),
        item: effectItem.getRollData?.() ?? effectItem.system,
      };
      const formula = Roll.replaceFormulaData(trimmedValue, rollData, { missing: "0" });

      try {
        return Roll.safeEval(formula);
      } catch (_error) {
        return formula;
      }
    }

    return trimmedValue;
  }

  _getAppliedEffectValue({ currentValue, operation = "add", value }) {
    switch (operation) {
      case "set":
      case "override":
        return value;
      case "add":
        return (Number(currentValue) || 0) + (Number(value) || 0);
      case "subtract":
        return (Number(currentValue) || 0) - (Number(value) || 0);
      case "multiply":
        return (Number(currentValue) || 0) * (Number(value) || 1);
      case "divide": {
        const divisor = Number(value) || 0;
        return divisor === 0 ? currentValue : (Number(currentValue) || 0) / divisor;
      }
      case "upgrade":
        return currentValue == null ? value : (currentValue >= value ? currentValue : value);
      case "downgrade":
        return currentValue == null ? value : (currentValue <= value ? currentValue : value);
      default:
        console.warn(`Unknown effect operation: ${operation}`);
        return currentValue;
    }
  }

  /**
   *
   * @param {*} data - The initial data object provided to the document creation request
   * @param {*} options - Additional options which modify the creation request
   * @param {*} userId - The id of the User requesting the document update
   */
  async _preCreate(data, options, userId) {
    if ((await super._preCreate(data, options, userId)) === false) return false;

    const prototypeToken = (typeof this.buildDynamicTokenRingData === 'function')
      ? this.buildDynamicTokenRingData()
      : { enabled: false, scale: 1, color: "#ffffff", effects: [], sight: { enabled: false, range: 0 }, actorLink: false };
    if (this.type === "contractor") Object.assign(prototypeToken, {
      sight: { enabled: true }, actorLink: true,
    });

    this.updateSource({
      "prototypeToken.ring.enabled": prototypeToken.enabled,
      "prototypeToken.ring.subject.scale": prototypeToken.scale,
      "prototypeToken.ring.colors.ring": prototypeToken.color,
      "prototypeToken.ring.effects": prototypeToken.effects,
      "prototypeToken.sight": prototypeToken.sight,
      "prototypeToken.actorLink": prototypeToken.actorLink ?? false
    });

  }

  /**
   *
   * @param {*} changed - The differential data that was changed relative to the documents prior values
   * @param {*} options - Additional options which modify the update request
   * @param {*} userId - The id of the User requesting the document update
   */
  async _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    const isNameUpdate = !!changed?.name;

    /*if (isMoxieUpdate && changed.system.moxie.value < 1) {
      this.triggerLoseItDynamicRingEffect();
      this.sendLosingItMessage();
    }*/
  }
/*
  sendLosingItMessage() {
    ChatMessage.create({
      speaker: { actor: this },
      content: "I'm LOSING IT!",
    });
  }*/

  easeFourPeaks(t) {
    return Math.sin(t * Math.PI * 3);
  }

  getAbilityShorthand(abilityName) {
    switch (abilityName) {
      case 'physick':
        return 'phy';
      case 'craveability':
        return 'cra';
      case 'thinkitude':
        return 'thi';
      case 'savvy':
        return 'sav';
      default:
        return '';
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }
}
