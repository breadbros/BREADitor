const DEBUG = false;

type EventKeys =
  | "MAP_UPDATE";
//   | "RENDER"
//   | "ENTITY_SELECTED"
//   | "SELECTED_ENTITY_UPDATED"
//   | "UPDATE_UI";

class _EventBus {
  bus: { [K in EventKeys]?: ((...vars: any[]) => any)[] };

  constructor() {
    this.bus = {};
  }

  $on(id: EventKeys, callback: (...vars: any[]) => any) {
    if (!this.bus[id]) this.bus[id] = [];
    this.bus[id]!.push(callback);
  }

  $off(id: EventKeys, callback: (...vars: any[]) => any) {
    if (!this.bus[id]) return;
    for (let i = this.bus[id]!.length - 1; i >= 0; i--) {
      if (this.bus[id]![i] === callback) {
        this.bus[id]!.splice(i, 1);
        return;
      }
    }
  }

  $emit(id: EventKeys, ...vars: any[]) {
    if (DEBUG) console.log("[emit]", id, ...vars);

    if (this.bus[id]) {
      for (let callback of this.bus[id]!) callback(...vars);
    }
  }
}

const EventBus = new _EventBus();

export default EventBus;