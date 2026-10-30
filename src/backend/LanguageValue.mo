import OQL "mo:caffeineai-oql";
import Common "types/common";

module {
  // Variant → tag text, so the customer language derives as a single Text
  // column and stays filterable.
  public func _toRow(self : Common.Language) : OQL.Value {
    #text(
      switch (self) {
        case (#ku) { "ku" };
        case (#ar) { "ar" };
        case (#en) { "en" };
      }
    );
  };
};
