import { resourceField, skillField } from "../index.mjs";

export class HypermallContractorData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const { SchemaField, NumberField, StringField } = foundry.data.fields;
        //const startingXP = game.settings.get(SystemSettingsKeys.SYSTEM, SystemSettingsKeys.STARTING_XP);
        //const data = actorData.data;
        return {
            meat: resourceField(0, 6), //how to set it when it's 2d6+3+physick?
            debt: resourceField(0, 6), // how to set when it's custom from background?
            stress: resourceField(0, 6), // how to set when it's 6+savvy?
            background: new StringField(),
            iclTeam: new StringField(),
            handedness: new StringField(),
            pronouns: new StringField(),
            zodiac: new StringField(),
            abilities: new SchemaField({
                physick: new SchemaField({
                    label: new StringField({ initial: "Physick" }),
                    value: new NumberField({ initial: 0 }),
                }),
                craveability: new SchemaField({
                    label: new StringField({ initial: "Craveability" }),
                    value: new NumberField({ initial: 0 }),
                }),
                thinkitude: new SchemaField({
                    label: new StringField({ initial: "Thinkitutde" }),
                    value: new NumberField({ initial: 0 }),
                }),
                savvy: new SchemaField({
                    label: new StringField({ initial: "Savvy" }),
                    value: new NumberField({ initial: 0 }),
                })
            }),
            derived: new SchemaField({
                gorge: new SchemaField({
                    label: new StringField({ initial: "Gorge" }),
                    value: new NumberField({ initial: 0 }),
                    max: new NumberField({ initial: 0 })
                }),
                dodge: new SchemaField({
                    label: new StringField({ initial: "Dodge" }),
                    value: new NumberField({ initial: 0 })
                })
            }),
            skills: new SchemaField({
                asskissing: skillField("Asskissing", 0),
                awareness: skillField("Awareness", 0),
                axe: skillField("Axe", 0),
                bash: skillField("Bash", 0),
                climbing: skillField("Climbing", 0),
                charm: skillField("Charm", 0),
                checkHumors: skillField("Check Humors", 0),
                cooking: skillField("Cooking", 0),
                corruption: skillField("Corruption", 0),
                cyberKarate: skillField("Cyber Karate", 0),
                dance: skillField("Dance", 0),
                dig: skillField("Dig", 0),
                disguise: skillField("Disguise", 0),
                explosives: skillField("Explosives", 0),
                fashion: skillField("Fashion", 0),
                fencing: skillField("Fencing", 0),
                finance: skillField("Finance", 0),
                gaming: skillField("Gaming", 0),
                gambling: skillField("Gambling", 0),
                hacking: skillField("Hacking", 0),
                heavyWeapon: skillField("Heavy Weapon", 0),
                intimidation: skillField("Intimidation", 0),
                knife: skillField("Knife", 0),
                levitation: skillField("Levitation", 0),
                medicine: skillField("Medicine", 0),
                meditation: skillField("Meditation", 0),
                pilot: skillField("Pilot", 0),
                pistol: skillField("Pistol", 0),
                publicSpeaking: skillField("Public Speaking", 0),
                rage: skillField("Rage", 0),
                rifle: skillField("Rifle", 0),
                running: skillField("Running", 0),
                shotgun: skillField("Shotgun", 0),
                spear: skillField("Spear", 0),
                skulk: skillField("Skulk", 0),
                sniperRifle: skillField("Sniper Rifle", 0),
                throw: skillField("Throw", 0),
                track: skillField("Track", 0),
                traps: skillField("Traps", 0),
                tech: skillField("Tech", 0),
                worship: skillField("Worship", 0),
                zeroGCombat: skillField("Zero G Combat", 0)
            }),
            allGear: new StringField({ initial: "List any of the gear you're responsible for here. Be sure to keep it in tip-top shape!" }),
            mutations: new StringField({ initial: "Note your mutations." }),
            psionics: new StringField({ initial: "Note your psionic powers." }),
            passions: new StringField({ initial: "Note your passions." }),
            height: new StringField({ initial: "" }),
            temperament: new StringField({ initial: "" }),
            style: new StringField({ initial: "" }),
            build: new StringField({ initial: "" }),
            deaths: new NumberField({ initial: 0 }),
        }
    }

    static migrateData(source) {
        try {
            // Defaulting for newly added fields
            if (source) {
                source.deaths = Number(source.deaths ?? source.death ?? 0);
            }

            return super.migrateData(source);
        } catch (e) {
            console.error("HypermallContractorData.migrateData error:", e);
            try { return super.migrateData(source); } catch (err) { console.error("super.migrateData also failed:", err); return source; }
        }
    }
}
