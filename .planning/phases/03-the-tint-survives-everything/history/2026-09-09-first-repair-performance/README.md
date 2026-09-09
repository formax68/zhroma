# First repair performance experiment

The correctness repair passed review and regressions, but the 1000-row enabled measurement exceeded the 16 ms CPU limit (maximum 47.2 ms). These samples are retained, not discarded. Source snapshot is content.js.txt; sample identity binds source and harness hashes. The first attempt timed out at the old 60-second CDP batch limit and produced no sample record. The completed attempt used the bounded 180-second batch limit. This prompted narrowing copied-marker discovery to mutation-added subtrees.
