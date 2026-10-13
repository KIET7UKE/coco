import mongoose from 'mongoose';

export const PAYMENT_STATUSES = ['awaiting', 'processing', 'paid', 'failed', 'cancelled', 'review'];

const orderSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, default: '' },
      company: { type: String, default: '' },
    },
    selection: {
      pkg: { type: String, required: true },
      model: { type: String, required: true },
      location: { type: String, required: true },
    },
    model: {
      id: String,
      name: String,
      cpu: String,
      vcpu: Number,
      ram: String,
      storage: String,
      network: String,
      u: Number,
    },
    dataCenter: {
      id: { type: String, required: true },
      provider: { type: String, default: '' },
      facility: { type: String, default: '' },
      city: { type: String, default: '' },
      region: { type: String, default: '' },
      country: { type: String, default: '' },
      shipTo: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    quote: {
      qty: { type: Number, required: true },
      rackU: { type: Number, required: true },
      unitPrice: { type: Number, default: 0 },
      serversSubtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      rackTotal: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    // What Stripe must charge for this order; fulfilment refuses any other amount.
    amountCents: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wire'],
      required: true,
      default: 'card',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'awaiting',
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // Set only after every server for this order exists, so a failed run is retried in full.
    provisionedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.methods.toPublic = function () {
  return {
    reference: this.reference,
    paymentMethod: this.paymentMethod,
    paymentStatus: this.paymentStatus,
    provisioned: Boolean(this.provisionedAt),
    createdAt: this.createdAt,
    paidAt: this.paidAt,
    customer: this.customer,
    selection: this.selection,
    model: this.model,
    dataCenter: this.dataCenter,
    quote: this.quote,
  };
};

export const Order = mongoose.model('Order', orderSchema);
