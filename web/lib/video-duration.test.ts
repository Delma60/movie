import test from "node:test";
import assert from "node:assert/strict";
import { formatDurationSeconds, parseDurationSeconds } from "./video-duration";

test("formats seconds into a readable duration label", () => {
  assert.equal(formatDurationSeconds(45), "45s");
  assert.equal(formatDurationSeconds(125), "2m 5s");
  assert.equal(formatDurationSeconds(3661), "1h 1m 1s");
  assert.equal(formatDurationSeconds(null), null);
});

test("parses duration input values safely", () => {
  assert.equal(parseDurationSeconds("90"), 90);
  assert.equal(parseDurationSeconds(" 2m "), null);
  assert.equal(parseDurationSeconds("0"), 0);
  assert.equal(parseDurationSeconds(""), null);
});
