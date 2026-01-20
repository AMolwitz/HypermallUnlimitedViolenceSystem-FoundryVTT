export class SystemSettingsKeys {
    static get SYSTEM() {
        return "hypermalluv";
    }

}

export function registerGameSettings() {
    game.settings.register(SystemSettingsKeys.SYSTEM, {
    });
}
