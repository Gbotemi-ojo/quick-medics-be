import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const paymentService = {
  // Verify the transaction with Paystack
  verifyTransaction: async (reference: string) => {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Paystack verification error:", error);
      throw new Error('Payment verification failed at Paystack');
    }
  }
};
