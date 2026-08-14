import ChatMessage from '../models/ChatMessage.js';
import Client from '../models/Client.js';
import Concern from '../models/Concern.js';
import Notice from '../models/Notice.js';
import Payment from '../models/Payment.js';
import PlatformConfig from '../models/PlatformConfig.js';
import Product from '../models/Product.js';
import Rating from '../models/Rating.js';
import Seller from '../models/Seller.js';
import Showroom from '../models/Showroom.js';
import ShowroomMessage from '../models/ShowroomMessage.js';
import User from '../models/User.js';

// Public entity registry exposed at /api/entities/:entity/...
// (User is intentionally excluded — it's managed through /api/auth/*)
export const entityModels = {
  ChatMessage,
  Client,
  Concern,
  Notice,
  Payment,
  PlatformConfig,
  Product,
  Rating,
  Seller,
  Showroom,
  ShowroomMessage,
};

export function getModel(entityName) {
  return entityModels[entityName];
}
