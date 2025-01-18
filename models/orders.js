import mongoose from 'mongoose';

const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    // Name of the artwork
    artName: {
      type: String,
      required: true,
    },
    // User account name
    userAccountName: {
      type: String,
      required: true, // Make it required to ensure every order has this
    },
    // Delivery details
    deliveryDetails: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    // Reference to user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const OrderModel =
  mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default OrderModel;
