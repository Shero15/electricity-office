# Project Guidance

## User Preferences

- Deep navy blue and electricity blue palette on a clean white background
- Professional government-portal typography and consistent spacing
- First screen offers language selection
- Full Kurdish Sorani, Arabic, and English support with proper RTL/LTR layouts
- Responsive desktop, tablet, and mobile layouts
- Simple forms and clear instructions
- No fake authentication, fake QR verification, hardcoded availability, or simulated success messages in production
- Realistic demo data only in development

## Verified Commands

- **typecheck**: `mops check --fix`
- **build**: `mops build`

## Learnings

- caffeineai-authorization isAdmin/getUserRole trap 'User is not registered' for unregistered principals; read userRoles directly for safe checks, and query funcs cannot call AccessControl.initialize (it mutates).
- Under Enhanced Migration, seed init-once data in the pending migration's NewActor output; the actor body has no initializers and initState() is dead code.
- OQL Entity.payload's _toRow is an implicit arg passed positionally; toEntity auto-derive fails on ?Optional and variant fields, so use toEntityManual or a custom <Type>Value.mo.
- The i18n Dictionary is a Widen<T> of en.ts, so every new en key must be mirrored in ar.ts and ku.ts or typecheck fails.
- TanStack Router routes with validateSearch make `search` required on every Link; pass `search={{ key: undefined }}`.
- TanStack Query detail views keyed by id need explicit invalidation of ['<entity>', id] in every mutation onSuccess; invalidating only the list key leaves the detail stale.
- `actor` and `label` are reserved Motoko keywords; mo:core Time.now() returns Int while Timestamp is Nat, so convert with Int.abs(Time.now()).
- Camera QR scanning uses native BarcodeDetector + getUserMedia; report unsupported/denied states honestly rather than faking a decode.
