// Lightweight re-implementation of the row-level-security rules that used to
// live in base44's entity .jsonc files. Kept intentionally simple: enough to
// preserve the app's real-world behaviour without a full policy engine.
//
// ownerFields: which field(s) on a document identify "this belongs to me"
// adminOnly:   true => only role:"admin" users may act, for the given verbs
// publicRead:  true => anyone (even logged out) may GET/list

export const entityRules = {
  ChatMessage: { ownerFields: ['created_by_id', 'seller_id', 'buyer_id'], publicRead: false },
  Client: { ownerFields: ['created_by_id', 'seller_id'], publicRead: false },
  Concern: { ownerFields: ['created_by_id'], publicRead: false },
  Notice: { ownerFields: [], publicRead: true, writeAdminOnly: true },
  Payment: { ownerFields: ['client_id', 'seller_id'], publicRead: false },
  PlatformConfig: { ownerFields: [], publicRead: false, adminOnly: true },
  Product: { ownerFields: ['created_by_id', 'seller_id'], publicRead: true },
  Rating: { ownerFields: ['rater_id'], publicRead: true },
  Seller: { ownerFields: ['created_by_id'], publicRead: false },
  Showroom: { ownerFields: ['host_id'], publicRead: true },
  ShowroomMessage: { ownerFields: ['sender_id'], publicRead: true },
};

export function getRules(entityName) {
  return entityRules[entityName] || { ownerFields: ['created_by_id'], publicRead: true };
}

// Entity-specific exceptions that a simple ownerFields list can't express.
// ShowroomMessage: only the sender can normally edit their own message, but
// the room's host also needs to approve/reject speak requests belonging to
// other people -- so allow updates from the showroom's host too.
export async function checkExtraOwnership(entityName, doc, user) {
  if (!user) return false;
  if (entityName === 'ShowroomMessage' && doc.showroom_id) {
    const { default: Showroom } = await import('../models/Showroom.js');
    const room = await Showroom.findById(doc.showroom_id).select('host_id').lean();
    return !!room && String(room.host_id) === String(user._id);
  }
  return false;
}
