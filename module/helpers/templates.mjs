/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  const templates = {
    // Actor partials.
    "actor-competencies": "systems/hypermalluv/templates/actor/parts/actor-competencies.html",
    "actor-thresholds": "systems/hypermalluv/templates/actor/parts/actor-thresholds.html",
    "actor-dice-roller": "systems/hypermalluv/templates/actor/parts/actor-dice-roller.html",
    "actor-damage": "systems/hypermalluv/templates/actor/parts/actor-damage.html",
    "actor-mutations": "systems/hypermalluv/templates/actor/parts/actor-mutations.html",
    "actor-psionics": "systems/hypermalluv/templates/actor/parts/actor-psionics.html",
    "actor-passions": "systems/hypermalluv/templates/actor/parts/actor-passions.html",
    "actor-foundry-data": "systems/hypermalluv/templates/actor/parts/actor-foundry-data.html",
    "actor-gear-list": "systems/hypermalluv/templates/actor/parts/actor-gear-list.html",
//systems/HMUV/templates/actor/parts/actor-foundry-data.html
    // App partials.
  };

  if (foundry.utils.isNewerVersion(game.version, "13")) {
    // If Foundry is version 13 or newer, use the new loadTemplates method
    return foundry.applications.handlebars.loadTemplates(templates);
  }

  return loadTemplates(templates);
};
