import assert from "node:assert";

import jsdom_global from "jsdom-global";

import moment from "../lib/module/moment.js";
import * as DateUtil from "../lib/timeline/DateUtil.js";
import Range from "../lib/timeline/Range.js";

const internals = {};

describe("DateUtil", () => {
  before(() => {
    internals.jsdom_global = jsdom_global();
  });

  after(() => {
    internals.jsdom_global();
  });

  describe("toScreen", () => {
    it("should give every day the same width with daily hidden hours, including the last one", () => {
      const width = 720;
      const range = {
        start: new Date(2026, 5, 1).valueOf(),
        end: new Date(2026, 5, 30, 23, 59, 59, 999).valueOf(),
        startToFront: false,
        endToFront: true,
        _applyRange(start, end) {
          this.start = start;
          this.end = end;
        },
        conversion(width, totalHidden) {
          return Range.conversion(this.start, this.end, width, totalHidden);
        },
      };
      const body = {
        hiddenDates: [],
        range,
        domProps: { centerContainer: { width } },
      };
      DateUtil.updateHiddenDates(moment, body, [
        {
          start: "2026-06-01T00:00:00",
          end: "2026-06-01T08:00:00",
          repeat: "daily",
        },
        {
          start: "2026-06-01T17:00:00",
          end: "2026-06-02T00:00:00",
          repeat: "daily",
        },
      ]);
      const core = { body, range, options: { moment } };

      // Day ticks are stepped over the hidden night, so they land on 08:00.
      // The tick after the last visible day lies past range.end.
      const widths = [];
      for (let day = 1; day <= 30; day++) {
        const x = DateUtil.toScreen(core, new Date(2026, 5, day, 8), width);
        const xNext = DateUtil.toScreen(
          core,
          new Date(2026, 5, day + 1, 8),
          width,
        );
        widths.push(Math.round(xNext - x));
      }

      assert.deepStrictEqual(widths, new Array(30).fill(24));
    });
  });
});
