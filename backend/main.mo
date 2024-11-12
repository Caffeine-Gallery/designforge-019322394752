import List "mo:base/List";

import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

actor {
    // Stable variable to store designs across upgrades
    private stable var designEntries : [(Text, Text)] = [];
    
    // HashMap to store designs (name -> design data)
    private var designs = HashMap.HashMap<Text, Text>(0, Text.equal, Text.hash);

    // System functions for upgrade persistence
    system func preupgrade() {
        designEntries := Iter.toArray(designs.entries());
    };

    system func postupgrade() {
        designs := HashMap.fromIter<Text, Text>(designEntries.vals(), 10, Text.equal, Text.hash);
        designEntries := [];
    };

    // Save a design
    public func saveDesign(name: Text, data: Text) : async () {
        designs.put(name, data);
    };

    // Load a design
    public query func loadDesign(name: Text) : async ?Text {
        designs.get(name)
    };

    // List all designs
    public query func listDesigns() : async [Text] {
        Iter.toArray(designs.keys())
    };
}
