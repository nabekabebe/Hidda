import { eventsForPerson, sortEvents } from "./events";
import { describe, expect, it } from "vitest";

describe("events", () => {
  it("orders a person's facts by date", () => {
    const events = sortEvents([
      { id: "2", type: "death", personId: "a", date: "2008-11-02", place: "", detail: "" },
      { id: "1", type: "birth", personId: "a", date: "1921-04-08", place: "", detail: "" },
    ]);
    expect(events.map((item) => item.id)).toEqual(["1", "2"]);
    expect(eventsForPerson(events, "a")).toHaveLength(2);
  });
});
