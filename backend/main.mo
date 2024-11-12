import Bool "mo:base/Bool";
import Int "mo:base/Int";
import List "mo:base/List";
import Nat "mo:base/Nat";

import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";

actor {
    // Type definitions
    type Design = {
        data: Text;
        timestamp: Int;
        version: Nat;
    };

    // Stable variables for upgrade persistence
    private stable var designEntries : [(Text, Design)] = [];
    private stable var versionCounter : Nat = 0;

    // HashMap to store designs
    private var designs = HashMap.HashMap<Text, Design>(0, Text.equal, Text.hash);

    // System functions for upgrade persistence
    system func preupgrade() {
        designEntries := Iter.toArray(designs.entries());
    };

    system func postupgrade() {
        designs := HashMap.fromIter<Text, Design>(designEntries.vals(), 10, Text.equal, Text.hash);
        designEntries := [];
    };

    // Save a design with versioning
    public func saveDesign(name: Text, data: Text) : async () {
        versionCounter += 1;
        let design : Design = {
            data = data;
            timestamp = Time.now();
            version = versionCounter;
        };
        designs.put(name, design);
    };

    // Load a specific design
    public query func loadDesign(name: Text) : async ?Text {
        switch (designs.get(name)) {
            case (?design) { ?design.data };
            case null { null };
        };
    };

    // List all designs with metadata
    public query func listDesigns() : async [(Text, Int, Nat)] {
        let buffer = Buffer.Buffer<(Text, Int, Nat)>(0);
        for ((name, design) in designs.entries()) {
            buffer.add((name, design.timestamp, design.version));
        };
        Buffer.toArray(buffer)
    };

    // Delete a design
    public func deleteDesign(name: Text) : async Bool {
        switch (designs.remove(name)) {
            case (?_) { true };
            case null { false };
        }
    };

    // Get design version
    public query func getDesignVersion(name: Text) : async ?Nat {
        switch (designs.get(name)) {
            case (?design) { ?design.version };
            case null { null };
        }
    };
}
