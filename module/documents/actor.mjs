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
    const systemData = actorData.system;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
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
