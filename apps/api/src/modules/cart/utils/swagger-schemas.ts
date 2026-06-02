export const cartResponseSchema = {
  type: 'object',
  properties: {
    cartToken: { type: 'string' },
    coupon: {
      type: 'object',
      nullable: true,
      properties: {
        code: { type: 'string' },
        discountType: { type: 'string' },
        discountValue: { type: 'number' },
        discountAmount: { type: 'number' },
      },
    },
    items: { type: 'array', items: { type: 'object', additionalProperties: true } },
    totals: {
      type: 'object',
      properties: {
        subtotal: { type: 'number' },
        productDiscount: { type: 'number' },
        couponDiscount: { type: 'number' },
        discountTotal: { type: 'number' },
        shipping: { type: 'number' },
        total: { type: 'number' },
      },
    },
    itemCount: { type: 'number' },
  },
};

export const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    code: { type: 'string' },
    details: { type: 'array', items: { type: 'object' } },
  },
};
