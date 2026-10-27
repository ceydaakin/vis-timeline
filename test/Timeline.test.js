import assert from "node:assert";

import jsdom_global from "jsdom-global";
import { DataSet } from "vis-data/esnext";

import Timeline from "../lib/timeline/Timeline.js";

const internals = {};

describe("Timeline", () => {
  before(() => {
    internals.jsdom = jsdom_global({
      pretendToBeVisual: true,
    });
    global["Element"] = window.Element;
    global["requestAnimationFrame"] = (cb) => {
      cb();
    };
  });

  after(() => {
    internals.jsdom();
  });

  it("should not throw when updating data in close succession", (done) => {
    const timeline = new Timeline(document.createElement("div"), []);

    const events = [
      { start: new Date(), id: 1 },
      { start: new Date(), id: 2 },
    ];

    timeline.setItems(new DataSet(events));

    setTimeout(() => {
      timeline.setItems(
        new DataSet([
          { start: new Date(), id: 3 },
          { start: new Date(), id: 4 },
          { start: new Date(), id: 5 },
        ]),
      );

      done();
    }, 5);

    timeline.setSelection([events[0].id], { animation: false });
  });

  it("setItems(null) should not crash", function () {
    const timeline = new Timeline(document.createElement("div"), []);

    timeline.setItems(null);
  });
  it("setItems(with custom ID property) should work", function () {
    const timeline = new Timeline(document.createElement("div"), []);
    const events = [
      { start: new Date(), fooid: 1 },
      { start: new Date(), fooid: 2 },
    ];
    const dataSet = new DataSet(events, { fieldId: "fooid" });
    timeline.setItems(dataSet);
    timeline.setSelection([2], { animation: false });
    const selectedIds = timeline.getSelection();
    assert(selectedIds.length === 1);
    assert(dataSet.get(selectedIds[0]).fooid === 2);
  });

  it("should position inner-stacked subgroups with a custom order when items come into view", function () {
    const start = new Date(2024, 0, 1);
    const end = new Date(2024, 0, 2);
    const groups = new DataSet([
      {
        id: "g",
        content: "G",
        subgroupStack: true,
        subgroupOrder: "subgroupOrder",
      },
    ]);
    const items = new DataSet(
      ["a", "b", "c"].map((subgroup, index) => ({
        id: subgroup,
        group: "g",
        subgroup,
        subgroupOrder: index,
        start,
        end,
      })),
    );
    // the items are out of range on the first draw
    const timeline = new Timeline(
      document.createElement("div"),
      items,
      groups,
      {
        start: new Date(2023, 0, 1),
        end: new Date(2023, 0, 2),
        stack: true,
        stackSubgroups: true,
        order: (a, b) => a.id.localeCompare(b.id),
      },
    );
    // jsdom has no layout, Core.redraw bails while the root has no width
    Object.defineProperty(timeline.dom.root, "offsetWidth", { value: 800 });
    timeline.redraw();

    timeline.setWindow(start, end, { animation: false });
    timeline.redraw();

    const subgroups = timeline.itemSet.groups.g.subgroups;
    assert(subgroups.a.top < subgroups.b.top);
    assert(subgroups.b.top < subgroups.c.top);
  });
});
